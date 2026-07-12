drop policy if exists "Users can create their own friend requests" on public.friendships;
drop policy if exists "Users can update their friendship state" on public.friendships;

revoke insert, update, delete on public.friendships from authenticated;
grant select on public.friendships to authenticated;

create or replace function public.send_friend_request(p_addressee_id uuid)
returns public.friendships
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  existing_friendship public.friendships;
begin
  if requester is null then
    raise exception 'You must be signed in';
  end if;

  if requester = p_addressee_id then
    raise exception 'You cannot add yourself';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_addressee_id and is_searchable = true and profile_visibility <> 'private'
  ) then
    raise exception 'That user is not available for friend requests';
  end if;

  select * into existing_friendship
  from public.friendships
  where (requester_id = requester and addressee_id = p_addressee_id)
     or (requester_id = p_addressee_id and addressee_id = requester)
  for update;

  if found then
    if existing_friendship.status = 'accepted' then
      raise exception 'You are already friends';
    end if;

    if existing_friendship.status = 'blocked' then
      raise exception 'This friendship is blocked';
    end if;

    if existing_friendship.status = 'pending' and existing_friendship.requester_id = requester then
      return existing_friendship;
    end if;

    if existing_friendship.status = 'pending' then
      raise exception 'This user has already sent you a request';
    end if;

    update public.friendships
    set requester_id = requester,
        addressee_id = p_addressee_id,
        status = 'pending',
        updated_at = now()
    where id = existing_friendship.id
    returning * into existing_friendship;

    return existing_friendship;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (requester, p_addressee_id, 'pending')
  returning * into existing_friendship;

  return existing_friendship;
end;
$$;

create or replace function public.resolve_friend_request(p_friendship_id uuid, p_action text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  friendship_row public.friendships;
begin
  if actor is null then
    raise exception 'You must be signed in';
  end if;

  select * into friendship_row
  from public.friendships
  where id = p_friendship_id
    and (requester_id = actor or addressee_id = actor)
  for update;

  if not found then
    raise exception 'Friendship not found';
  end if;

  if p_action = 'accept' or p_action = 'reject' then
    if friendship_row.addressee_id <> actor or friendship_row.status <> 'pending' then
      raise exception 'Only a pending incoming request can be resolved';
    end if;

    update public.friendships
    set status = case when p_action = 'accept' then 'accepted'::public.friendship_status else 'rejected'::public.friendship_status end,
        updated_at = now()
    where id = friendship_row.id;
    return true;
  end if;

  if p_action = 'cancel' then
    if friendship_row.requester_id <> actor or friendship_row.status <> 'pending' then
      raise exception 'Only a pending outgoing request can be cancelled';
    end if;

    delete from public.friendships where id = friendship_row.id;
    return true;
  end if;

  if p_action = 'remove' then
    if friendship_row.status <> 'accepted' then
      raise exception 'Only an accepted friendship can be removed';
    end if;

    delete from public.friendships where id = friendship_row.id;
    return true;
  end if;

  if p_action = 'block' then
    update public.friendships
    set status = 'blocked', updated_at = now()
    where id = friendship_row.id;
    return true;
  end if;

  raise exception 'Unsupported friendship action';
end;
$$;

create or replace function public.get_leaderboard(p_scope text default 'global', p_limit integer default 50)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  username text,
  favorite_team_name text,
  total_points bigint,
  exact_scores bigint,
  called_it_cards bigint,
  current_streak bigint,
  correct_outcomes bigint,
  correct_first_goalscorers bigint,
  predictions_made bigint,
  accuracy numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in';
  end if;

  if p_scope not in ('global', 'friends') then
    raise exception 'Unsupported leaderboard scope';
  end if;

  return query
  with prediction_rows as (
    select
      prediction.user_id,
      prediction.match_id,
      prediction.total_points,
      prediction.outcome_points,
      prediction.exact_score_points,
      prediction.first_goalscorer_points,
      prediction.is_exact_score,
      prediction.is_called_it,
      match.kickoff_at
    from public.predictions prediction
    join public.matches match on match.id = prediction.match_id
    where match.status = 'finished'
      and prediction.scored_at is not null
  ),
  aggregate_rows as (
    select
      prediction_row.user_id,
      coalesce(sum(prediction_row.total_points), 0)::bigint as total_points,
      count(*)::bigint as predictions_made,
      count(*) filter (where prediction_row.outcome_points > 0)::bigint as correct_outcomes,
      count(*) filter (where prediction_row.first_goalscorer_points > 0)::bigint as correct_first_goalscorers,
      count(*) filter (where prediction_row.is_exact_score)::bigint as exact_scores,
      count(*) filter (where prediction_row.is_called_it)::bigint as called_it_cards,
      round(coalesce(count(*) filter (where prediction_row.outcome_points > 0)::numeric / nullif(count(*), 0), 0), 4) as accuracy
    from prediction_rows prediction_row
    group by prediction_row.user_id
  ),
  streak_rows as (
    select
      ordered_prediction.user_id,
      count(*) filter (where ordered_prediction.missed_before = 0 and ordered_prediction.outcome_points > 0)::bigint as current_streak
    from (
      select
        prediction_row.user_id,
        prediction_row.outcome_points,
        sum(case when prediction_row.outcome_points > 0 then 0 else 1 end) over (
          partition by prediction_row.user_id order by prediction_row.kickoff_at desc, prediction_row.match_id desc
          rows between unbounded preceding and current row
        ) as missed_before
      from prediction_rows prediction_row
    ) ordered_predictions
    group by ordered_prediction.user_id
  ),
  eligible_profiles as (
    select profile.*
    from public.profiles profile
    where (profile.profile_visibility <> 'private' or profile.id = auth.uid())
      and (
        p_scope = 'global'
        or profile.id = auth.uid()
        or exists (
          select 1 from public.friendships friendship
          where friendship.status = 'accepted'
            and ((friendship.requester_id = auth.uid() and friendship.addressee_id = profile.id)
              or (friendship.addressee_id = auth.uid() and friendship.requester_id = profile.id))
        )
      )
  ),
  ranked_rows as (
    select
      rank() over (
        order by
          coalesce(aggregate.total_points, 0) desc,
          coalesce(aggregate.called_it_cards, 0) desc,
          coalesce(aggregate.exact_scores, 0) desc,
          coalesce(aggregate.correct_first_goalscorers, 0) desc,
          coalesce(aggregate.accuracy, 0) desc
      ) as rank,
      profile.id as user_id,
      profile.display_name,
      profile.username::text,
      team.name as favorite_team_name,
      coalesce(aggregate.total_points, 0)::bigint as total_points,
      coalesce(aggregate.exact_scores, 0)::bigint as exact_scores,
      coalesce(aggregate.called_it_cards, 0)::bigint as called_it_cards,
      coalesce(streak.current_streak, 0)::bigint as current_streak,
      coalesce(aggregate.correct_outcomes, 0)::bigint as correct_outcomes,
      coalesce(aggregate.correct_first_goalscorers, 0)::bigint as correct_first_goalscorers,
      coalesce(aggregate.predictions_made, 0)::bigint as predictions_made,
      coalesce(aggregate.accuracy, 0)::numeric as accuracy
    from eligible_profiles profile
    left join aggregate_rows aggregate on aggregate.user_id = profile.id
    left join streak_rows streak on streak.user_id = profile.id
    left join public.teams team on team.id = profile.favorite_team_id
  )
  select ranked_rows.*
  from ranked_rows
  order by ranked_rows.rank, ranked_rows.display_name
  limit greatest(1, least(coalesce(p_limit, 50), 1000));
end;
$$;

create or replace function public.get_profile_stats(p_profile_id uuid default null)
returns table (
  global_rank bigint,
  friends_rank bigint,
  total_points bigint,
  predictions_made bigint,
  correct_outcomes bigint,
  correct_first_goalscorers bigint,
  exact_scores bigint,
  called_it_cards bigint,
  current_streak bigint,
  accuracy numeric,
  average_points numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid := coalesce(p_profile_id, auth.uid());
begin
  if auth.uid() is null or target_id <> auth.uid() then
    raise exception 'You may only view your own profile statistics';
  end if;

  return query
  with global_rows as (
    select * from public.get_leaderboard('global', 1000)
  ),
  friends_rows as (
    select * from public.get_leaderboard('friends', 1000)
  )
  select
    global_rows.rank,
    friends_rows.rank,
    global_rows.total_points,
    global_rows.predictions_made,
    global_rows.correct_outcomes,
    global_rows.correct_first_goalscorers,
    global_rows.exact_scores,
    global_rows.called_it_cards,
    global_rows.current_streak,
    global_rows.accuracy,
    round(coalesce(global_rows.total_points::numeric / nullif(global_rows.predictions_made, 0), 0), 2)
  from global_rows
  left join friends_rows on friends_rows.user_id = global_rows.user_id
  where global_rows.user_id = target_id;
end;
$$;

revoke execute on function public.send_friend_request(uuid) from public, anon, service_role;
revoke execute on function public.resolve_friend_request(uuid, text) from public, anon, service_role;
revoke execute on function public.get_leaderboard(text, integer) from public, anon, service_role;
revoke execute on function public.get_profile_stats(uuid) from public, anon, service_role;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.resolve_friend_request(uuid, text) to authenticated;
grant execute on function public.get_leaderboard(text, integer) to authenticated;
grant execute on function public.get_profile_stats(uuid) to authenticated;
