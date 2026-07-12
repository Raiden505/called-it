create or replace function public.submit_prediction(
  p_match_id uuid,
  p_home_score smallint,
  p_away_score smallint,
  p_first_goalscorer_id uuid,
  p_no_goalscorer boolean,
  p_advanced_team_id uuid,
  p_confidence_multiplier smallint
)
returns public.predictions
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := (select auth.uid());
  match_row public.matches%rowtype;
  existing_prediction public.predictions%rowtype;
  has_existing_prediction boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_home_score < 0 or p_away_score < 0 then
    raise exception 'Scores cannot be negative' using errcode = '22023';
  end if;

  if p_confidence_multiplier not in (1, 2, 3) then
    raise exception 'Confidence multiplier must be 1, 2, or 3' using errcode = '22023';
  end if;

  if p_no_goalscorer and p_first_goalscorer_id is not null then
    raise exception 'Choose a player or no goalscorer, not both' using errcode = '22023';
  end if;

  select * into match_row
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match not found' using errcode = 'P0002';
  end if;

  if match_row.status <> 'scheduled' or now() >= match_row.kickoff_at then
    raise exception 'Predictions are locked at kickoff' using errcode = '42501';
  end if;

  if p_first_goalscorer_id is not null and not exists (
    select 1
    from public.players
    where id = p_first_goalscorer_id
      and team_id in (match_row.home_team_id, match_row.away_team_id)
  ) then
    raise exception 'First goalscorer must belong to one of the teams' using errcode = '22023';
  end if;

  if p_advanced_team_id is not null and p_advanced_team_id not in (match_row.home_team_id, match_row.away_team_id) then
    raise exception 'Advanced team must be one of the competing teams' using errcode = '22023';
  end if;

  select * into existing_prediction
  from public.predictions
  where user_id = current_user_id
    and match_id = p_match_id
  for update;
  has_existing_prediction := found;

  insert into public.confidence_allocations (user_id, tournament_id, multiplier, allowed_count)
  values
    (current_user_id, match_row.tournament_id, 2, 3),
    (current_user_id, match_row.tournament_id, 3, 1)
  on conflict (user_id, tournament_id, multiplier) do nothing;

  perform 1
  from public.confidence_allocations
  where user_id = current_user_id
    and tournament_id = match_row.tournament_id
    and multiplier in (2, 3)
  for update;

  if has_existing_prediction and existing_prediction.confidence_multiplier > 1 and existing_prediction.confidence_multiplier <> p_confidence_multiplier then
    update public.confidence_allocations
    set used_count = greatest(0, used_count - 1)
    where user_id = current_user_id
      and tournament_id = match_row.tournament_id
      and multiplier = existing_prediction.confidence_multiplier;
  end if;

  if p_confidence_multiplier > 1 and (not has_existing_prediction or existing_prediction.confidence_multiplier <> p_confidence_multiplier) then
    update public.confidence_allocations
    set used_count = used_count + 1
    where user_id = current_user_id
      and tournament_id = match_row.tournament_id
      and multiplier = p_confidence_multiplier
      and used_count < allowed_count;

    if not found then
      raise exception 'No confidence multipliers remaining for this tournament' using errcode = 'P0001';
    end if;
  end if;

  if has_existing_prediction then
    update public.predictions
    set predicted_home_score = p_home_score,
        predicted_away_score = p_away_score,
        predicted_first_goalscorer_id = p_first_goalscorer_id,
        predicted_no_goalscorer = p_no_goalscorer,
        predicted_advanced_team_id = p_advanced_team_id,
        confidence_multiplier = p_confidence_multiplier
    where id = existing_prediction.id;
  else
    insert into public.predictions (
      user_id,
      match_id,
      predicted_home_score,
      predicted_away_score,
      predicted_first_goalscorer_id,
      predicted_no_goalscorer,
      predicted_advanced_team_id,
      confidence_multiplier
    )
    values (
      current_user_id,
      p_match_id,
      p_home_score,
      p_away_score,
      p_first_goalscorer_id,
      p_no_goalscorer,
      p_advanced_team_id,
      p_confidence_multiplier
    )
    returning * into existing_prediction;
  end if;

  return existing_prediction;
end;
$$;

revoke execute on function public.submit_prediction(uuid, smallint, smallint, uuid, boolean, uuid, smallint) from public, anon, service_role;
grant execute on function public.submit_prediction(uuid, smallint, smallint, uuid, boolean, uuid, smallint) to authenticated;
revoke insert, update on public.predictions from authenticated;
