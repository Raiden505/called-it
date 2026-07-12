alter table public.notifications add column if not exists dedupe_key text;
create unique index if not exists notifications_dedupe_key_idx on public.notifications(dedupe_key) where dedupe_key is not null;

create or replace function public.apply_processed_match_result(
  p_match_id uuid,
  p_expected_result_version integer,
  p_home_score_90 smallint,
  p_away_score_90 smallint,
  p_home_score_final smallint,
  p_away_score_final smallint,
  p_first_goalscorer_id uuid,
  p_first_goal_was_own_goal boolean,
  p_advanced_team_id uuid,
  p_predictions jsonb,
  p_card_rarity text,
  p_card_rarity_percentage numeric,
  p_result_candidate_hash text default null
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  match_row public.matches%rowtype;
  result_version_value integer;
begin
  select * into match_row from public.matches where id = p_match_id for update;
  if not found then raise exception 'Match not found'; end if;
  if match_row.result_version <> p_expected_result_version then raise exception 'Stale match result version' using errcode = '40001'; end if;
  if p_first_goalscorer_id is not null and not exists (select 1 from public.players where id = p_first_goalscorer_id and team_id in (match_row.home_team_id, match_row.away_team_id)) then raise exception 'First goalscorer must belong to one of the teams'; end if;
  if p_advanced_team_id is not null and p_advanced_team_id not in (match_row.home_team_id, match_row.away_team_id) then raise exception 'Advanced team must be one of the competing teams'; end if;

  if match_row.status = 'finished'
     and match_row.home_score_90 = p_home_score_90
     and match_row.away_score_90 = p_away_score_90
     and match_row.first_goalscorer_id is not distinct from p_first_goalscorer_id
     and match_row.first_goal_was_own_goal = p_first_goal_was_own_goal
     and match_row.advanced_team_id is not distinct from p_advanced_team_id then
    result_version_value := match_row.result_version;
  else
    result_version_value := match_row.result_version + 1;
  end if;

  update public.predictions prediction
  set scored_at = now(),
      scored_result_version = result_version_value,
      outcome_points = scored.outcome_points,
      goal_difference_points = scored.goal_difference_points,
      exact_score_points = scored.exact_score_points,
      first_goalscorer_points = scored.first_goalscorer_points,
      advance_points = scored.advance_points,
      base_points = scored.base_points,
      total_points = scored.total_points,
      is_exact_score = scored.is_exact_score,
      is_called_it = scored.is_called_it
  from jsonb_to_recordset(p_predictions) as scored(
    id uuid,
    outcome_points integer,
    goal_difference_points integer,
    exact_score_points integer,
    first_goalscorer_points integer,
    advance_points integer,
    base_points integer,
    total_points integer,
    is_exact_score boolean,
    is_called_it boolean
  )
  where prediction.id = scored.id and prediction.match_id = p_match_id;

  create temporary table _called_it_revocations(prediction_id uuid, user_id uuid) on commit drop;
  insert into _called_it_revocations
  select card.prediction_id, card.user_id
  from public.called_it_cards card
  where card.match_id = p_match_id
    and card.revoked_at is null
    and not exists (select 1 from jsonb_to_recordset(p_predictions) as eligible(id uuid, is_called_it boolean) where eligible.id = card.prediction_id and eligible.is_called_it);

  update public.called_it_cards card
  set revoked_at = now()
  where card.match_id = p_match_id and card.revoked_at is null
    and exists (select 1 from _called_it_revocations revoked where revoked.prediction_id = card.prediction_id);

  update public.called_it_cards card
  set rarity = p_card_rarity, rarity_percentage = p_card_rarity_percentage, result_version = result_version_value, revoked_at = null
  where card.match_id = p_match_id
    and exists (select 1 from jsonb_to_recordset(p_predictions) as eligible(id uuid, is_called_it boolean) where eligible.id = card.prediction_id and eligible.is_called_it);

  insert into public.called_it_cards(prediction_id, user_id, match_id, public_slug, rarity, rarity_percentage, result_version)
  select scored.id, scored.user_id, p_match_id, 'called-it-' || replace(gen_random_uuid()::text, '-', ''), p_card_rarity, p_card_rarity_percentage, result_version_value
  from jsonb_to_recordset(p_predictions) as scored(id uuid, user_id uuid, is_called_it boolean)
  where scored.is_called_it
    and not exists (select 1 from public.called_it_cards card where card.prediction_id = scored.id and card.revoked_at is null);

  insert into public.notifications(user_id, type, payload, dedupe_key)
  select revoked.user_id, 'called_it_revoked', jsonb_build_object('matchId', p_match_id, 'predictionId', revoked.prediction_id, 'resultVersion', result_version_value), 'called-it:' || revoked.prediction_id || ':result:' || result_version_value || ':revoked'
  from _called_it_revocations revoked
  on conflict (dedupe_key) where dedupe_key is not null do nothing;

  insert into public.notifications(user_id, type, payload, dedupe_key)
  select card.user_id, 'called_it_earned', jsonb_build_object('cardId', card.id, 'publicSlug', card.public_slug, 'matchId', p_match_id, 'resultVersion', result_version_value), 'called-it:' || card.prediction_id || ':result:' || result_version_value || ':earned'
  from public.called_it_cards card
  where card.match_id = p_match_id and card.revoked_at is null
    and exists (select 1 from jsonb_to_recordset(p_predictions) as eligible(id uuid, is_called_it boolean) where eligible.id = card.prediction_id and eligible.is_called_it)
  on conflict (dedupe_key) where dedupe_key is not null do nothing;

  update public.matches
  set status = 'finished', home_score_90 = p_home_score_90, away_score_90 = p_away_score_90,
      home_score_final = coalesce(p_home_score_final, p_home_score_90), away_score_final = coalesce(p_away_score_final, p_away_score_90),
      first_goalscorer_id = p_first_goalscorer_id, first_goal_was_own_goal = p_first_goal_was_own_goal,
      advanced_team_id = p_advanced_team_id, result_version = result_version_value, result_confirmed_at = now(),
      result_processed_at = now(), result_processing_status = 'processed',
      result_candidate_hash = coalesce(p_result_candidate_hash, result_candidate_hash)
  where id = p_match_id;

  return result_version_value;
end;
$$;

revoke execute on function public.apply_processed_match_result(uuid, integer, smallint, smallint, smallint, smallint, uuid, boolean, uuid, jsonb, text, numeric, text) from public, anon, authenticated;
grant execute on function public.apply_processed_match_result(uuid, integer, smallint, smallint, smallint, smallint, uuid, boolean, uuid, jsonb, text, numeric, text) to service_role;
