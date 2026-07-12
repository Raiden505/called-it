-- Phase 1 sports sync foundation. Provider data is server-managed; seeded data remains isolated.
alter table public.tournaments add column provider text not null default 'seed';
alter table public.teams add column provider text not null default 'seed';
alter table public.players add column provider text not null default 'seed';
alter table public.matches add column provider text not null default 'seed';

alter table public.tournaments drop constraint if exists tournaments_external_id_key;
alter table public.teams drop constraint if exists teams_external_id_key;
alter table public.players drop constraint if exists players_external_id_key;
alter table public.matches drop constraint if exists matches_external_id_key;
create unique index tournaments_provider_external_id_key on public.tournaments(provider, external_id);
create unique index teams_provider_external_id_key on public.teams(provider, external_id);
create unique index players_provider_external_id_key on public.players(provider, external_id);
create unique index matches_provider_external_id_key on public.matches(provider, external_id);

alter table public.tournaments add column provider_coverage jsonb not null default '{}'::jsonb;
alter table public.tournaments add column last_synced_at timestamptz;
alter table public.tournaments add column next_sync_at timestamptz;
alter table public.tournaments add column sync_enabled boolean not null default false;

alter table public.matches add column provider_status text;
alter table public.matches add column kickoff_confirmed boolean not null default true;
alter table public.matches add column actual_started_at timestamptz;
alter table public.matches add column predictions_closed_at timestamptz;
alter table public.matches add column penalty_home_score smallint;
alter table public.matches add column penalty_away_score smallint;
alter table public.matches add column result_candidate_hash text;
alter table public.matches add column result_candidate_seen_at timestamptz;
alter table public.matches add column result_candidate_observations smallint not null default 0;
alter table public.matches add column result_processing_status text not null default 'not_ready';
alter table public.matches add column result_processed_at timestamptz;
alter table public.matches add column next_sync_at timestamptz;
alter table public.matches add column sync_failure_count integer not null default 0;
alter table public.matches add column sync_last_error_code text;
alter table public.matches add constraint matches_result_processing_status_check check (result_processing_status in ('not_ready', 'candidate', 'processing', 'processed', 'manual_review', 'failed'));

create table public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  team_id uuid not null references public.teams(id) on delete restrict,
  source text not null,
  lineup_role text,
  is_active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (match_id, player_id),
  constraint match_players_source_check check (source in ('squad', 'lineup', 'event')),
  constraint match_players_role_check check (lineup_role is null or lineup_role in ('starter', 'substitute', 'squad'))
);

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  provider text not null,
  provider_event_key text not null,
  source_order integer not null,
  elapsed smallint,
  extra smallint,
  event_type text not null,
  detail text,
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  is_goal boolean not null default false,
  is_own_goal boolean not null default false,
  is_cancelled boolean not null default false,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, provider_event_key)
);

create table public.sports_sync_runs (
  id uuid primary key default gen_random_uuid(),
  trigger_type text not null,
  scope text not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fixture_count integer not null default 0,
  team_count integer not null default 0,
  player_count integer not null default 0,
  event_count integer not null default 0,
  provider_request_count integer not null default 0,
  duration_ms integer,
  provider_quota jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  constraint sports_sync_runs_status_check check (status in ('running', 'succeeded', 'partial', 'failed', 'skipped'))
);

create table public.sports_sync_leases (
  lease_key text primary key,
  holder_id uuid not null,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index matches_provider_status_next_sync_idx on public.matches(provider, provider_status, next_sync_at);
create index matches_result_processing_next_sync_idx on public.matches(result_processing_status, next_sync_at);
create index match_players_match_idx on public.match_players(match_id);
create index match_players_team_idx on public.match_players(team_id);
create index match_events_match_idx on public.match_events(match_id, source_order);
create index sports_sync_runs_started_idx on public.sports_sync_runs(started_at desc);

alter table public.match_players enable row level security;
alter table public.match_events enable row level security;
alter table public.sports_sync_runs enable row level security;
alter table public.sports_sync_leases enable row level security;

revoke all on public.match_players from anon, authenticated;
revoke all on public.match_events from anon, authenticated;
revoke all on public.sports_sync_runs from anon, authenticated;
revoke all on public.sports_sync_leases from anon, authenticated;
grant all on public.match_players to service_role;
grant all on public.match_events to service_role;
grant all on public.sports_sync_runs to service_role;
grant all on public.sports_sync_leases to service_role;

create or replace function public.acquire_sports_sync_lease(p_lease_key text, p_holder_id uuid, p_ttl_seconds integer)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.sports_sync_leases(lease_key, holder_id, acquired_at, expires_at)
  values (p_lease_key, p_holder_id, now(), now() + make_interval(secs => p_ttl_seconds))
  on conflict (lease_key) do update
    set holder_id = excluded.holder_id, acquired_at = now(), expires_at = excluded.expires_at
    where sports_sync_leases.expires_at <= now() or sports_sync_leases.holder_id = p_holder_id;
  return found;
end;
$$;

revoke execute on function public.acquire_sports_sync_lease(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.acquire_sports_sync_lease(text, uuid, integer) to service_role;
