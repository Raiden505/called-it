create extension if not exists citext with schema extensions;

create type public.profile_visibility as enum ('public', 'friends', 'private');
create type public.friendship_status as enum ('pending', 'accepted', 'rejected', 'blocked');
create type public.tournament_status as enum ('upcoming', 'active', 'completed');
create type public.match_status as enum ('scheduled', 'live', 'finished', 'postponed', 'cancelled');

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  season text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.tournament_status not null default 'upcoming',
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  short_name text not null,
  code text,
  badge_url text,
  country_code text,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  team_id uuid not null references public.teams(id) on delete restrict,
  name text not null,
  position text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext unique,
  display_name text not null default 'New predictor',
  avatar_url text,
  favorite_team_id uuid references public.teams(id) on delete set null,
  country_code text,
  bio text,
  is_searchable boolean not null default true,
  profile_visibility public.profile_visibility not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_username_length check (username is null or char_length(username) between 3 and 30),
  constraint profile_bio_length check (bio is null or char_length(bio) <= 280)
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendship_distinct_users check (requester_id <> addressee_id),
  constraint friendship_canonical_pair unique (requester_id, addressee_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  tournament_id uuid not null references public.tournaments(id) on delete restrict,
  home_team_id uuid not null references public.teams(id) on delete restrict,
  away_team_id uuid not null references public.teams(id) on delete restrict,
  stage text not null,
  kickoff_at timestamptz not null,
  status public.match_status not null default 'scheduled',
  home_score_90 smallint,
  away_score_90 smallint,
  home_score_final smallint,
  away_score_final smallint,
  first_goalscorer_id uuid references public.players(id) on delete set null,
  first_goal_was_own_goal boolean not null default false,
  advanced_team_id uuid references public.teams(id) on delete set null,
  result_version integer not null default 0,
  result_confirmed_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  constraint match_distinct_teams check (home_team_id <> away_team_id),
  constraint match_scores_non_negative check (
    (home_score_90 is null or home_score_90 >= 0) and
    (away_score_90 is null or away_score_90 >= 0) and
    (home_score_final is null or home_score_final >= 0) and
    (away_score_final is null or away_score_final >= 0)
  )
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_home_score smallint not null,
  predicted_away_score smallint not null,
  predicted_first_goalscorer_id uuid references public.players(id) on delete set null,
  predicted_no_goalscorer boolean not null default false,
  predicted_advanced_team_id uuid references public.teams(id) on delete set null,
  confidence_multiplier smallint not null default 1,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked_at timestamptz,
  scored_at timestamptz,
  scored_result_version integer,
  outcome_points integer not null default 0,
  goal_difference_points integer not null default 0,
  exact_score_points integer not null default 0,
  first_goalscorer_points integer not null default 0,
  advance_points integer not null default 0,
  base_points integer not null default 0,
  total_points integer not null default 0,
  is_exact_score boolean not null default false,
  is_called_it boolean not null default false,
  constraint prediction_unique_user_match unique (user_id, match_id),
  constraint prediction_scores_non_negative check (predicted_home_score >= 0 and predicted_away_score >= 0),
  constraint prediction_multiplier_valid check (confidence_multiplier in (1, 2, 3)),
  constraint prediction_goalscorer_exclusive check (not (predicted_no_goalscorer and predicted_first_goalscorer_id is not null))
);

create table public.confidence_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  multiplier integer not null,
  allowed_count integer not null,
  used_count integer not null default 0,
  unique (user_id, tournament_id, multiplier),
  constraint allocation_multiplier_valid check (multiplier in (1, 2, 3)),
  constraint allocation_counts_valid check (allowed_count >= 0 and used_count >= 0 and used_count <= allowed_count)
);

create table public.called_it_cards (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null unique references public.predictions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  public_slug text not null unique,
  rarity text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  summary_type text not null,
  source_snapshot jsonb not null,
  content jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

create index matches_kickoff_at_idx on public.matches(kickoff_at);
create index matches_tournament_kickoff_idx on public.matches(tournament_id, kickoff_at);
create index matches_status_idx on public.matches(status);
create index friendships_participants_idx on public.friendships(requester_id, addressee_id);
create unique index friendships_canonical_pair_idx on public.friendships (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
);
create index predictions_match_idx on public.predictions(match_id);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger friendships_set_updated_at before update on public.friendships
for each row execute function public.set_updated_at();

create trigger predictions_set_updated_at before update on public.predictions
for each row execute function public.set_updated_at();

create or replace function public.prevent_prediction_server_field_edits()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select auth.uid()) is not null and (
    new.id is distinct from old.id or
    new.user_id is distinct from old.user_id or
    new.match_id is distinct from old.match_id or
    new.submitted_at is distinct from old.submitted_at or
    new.locked_at is distinct from old.locked_at or
    new.scored_at is distinct from old.scored_at or
    new.scored_result_version is distinct from old.scored_result_version or
    new.outcome_points is distinct from old.outcome_points or
    new.goal_difference_points is distinct from old.goal_difference_points or
    new.exact_score_points is distinct from old.exact_score_points or
    new.first_goalscorer_points is distinct from old.first_goalscorer_points or
    new.advance_points is distinct from old.advance_points or
    new.base_points is distinct from old.base_points or
    new.total_points is distinct from old.total_points or
    new.is_exact_score is distinct from old.is_exact_score or
    new.is_called_it is distinct from old.is_called_it
  ) then
    raise exception 'Prediction server-owned fields cannot be changed by clients';
  end if;
  return new;
end;
$$;

create trigger predictions_protect_server_fields
  before update on public.predictions
  for each row execute function public.prevent_prediction_server_field_edits();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'predictor'), '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.friendships to authenticated;
grant select on public.tournaments, public.teams, public.players, public.matches to authenticated;
grant select, insert, update on public.predictions to authenticated;
grant select on public.confidence_allocations to authenticated;
grant select on public.called_it_cards to anon, authenticated;
grant select, update on public.notifications to authenticated;
grant select on public.ai_summaries to authenticated;

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.confidence_allocations enable row level security;
alter table public.called_it_cards enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_summaries enable row level security;

create policy "Authenticated users can read public profiles"
  on public.profiles for select to authenticated
  using (profile_visibility = 'public' or id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users can read their friendships"
  on public.friendships for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy "Users can create their own friend requests"
  on public.friendships for insert to authenticated
  with check (requester_id = (select auth.uid()));

create policy "Users can update their friendship state"
  on public.friendships for update to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()))
  with check (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy "Authenticated users can read tournaments"
  on public.tournaments for select to authenticated using (true);

create policy "Authenticated users can read teams"
  on public.teams for select to authenticated using (true);

create policy "Authenticated users can read players"
  on public.players for select to authenticated using (true);

create policy "Authenticated users can read matches"
  on public.matches for select to authenticated using (true);

create policy "Users can read their own predictions"
  on public.predictions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Friends can read predictions after kickoff"
  on public.predictions for select to authenticated
  using (
    exists (
      select 1
      from public.friendships friendship
      join public.matches match on match.id = public.predictions.match_id
      where friendship.status = 'accepted'
        and match.kickoff_at <= now()
        and ((friendship.requester_id = (select auth.uid()) and friendship.addressee_id = public.predictions.user_id)
          or (friendship.addressee_id = (select auth.uid()) and friendship.requester_id = public.predictions.user_id))
    )
  );

create policy "Users can submit predictions before kickoff"
  on public.predictions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.matches match where match.id = predictions.match_id and match.kickoff_at > now() and match.status = 'scheduled')
  );

create policy "Users can edit predictions before kickoff"
  on public.predictions for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.matches match where match.id = predictions.match_id and match.kickoff_at > now() and match.status = 'scheduled')
  )
  with check (user_id = (select auth.uid()));

create policy "Users can read their confidence allocations"
  on public.confidence_allocations for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Anyone can read public Called It cards"
  on public.called_it_cards for select to anon, authenticated
  using (is_public = true);

create policy "Users can read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can update their notifications"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can read their AI summaries"
  on public.ai_summaries for select to authenticated
  using (user_id = (select auth.uid()));
