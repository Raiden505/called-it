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
    ) ordered_prediction
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

revoke execute on function public.get_leaderboard(text, integer) from public, anon, service_role;
grant execute on function public.get_leaderboard(text, integer) to authenticated;
