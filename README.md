# Called It

Called It is a social football prediction platform. Users predict match outcomes, earn points for accuracy, and compete with friends.

## Phase 1 foundation

The repository currently contains the Phase 1 application shell:

- Next.js App Router with TypeScript and Tailwind CSS.
- Email/password and Google OAuth screens backed by Supabase Auth.
- Browser, server, middleware, and admin Supabase clients.
- Protected dashboard route and session-refresh middleware.
- Source-controlled initial schema and demo tournament seed data.

Phase 2 adds the protected match list, prediction form, atomic server-side submission, confidence limits, deterministic scoring, and admin result-processing endpoint. Phase 3 adds friend discovery and approval, global/friends leaderboards, and profile statistics. Phase 4 adds server-issued Called It cards, rarity, profile collections, public proof pages, sharing, and result-correction revocation.

Phase 7 completes the matchday UI integration: authenticated server reads refresh automatically, match cards show live/result-pending/confirmed lifecycle states, stale provider data is called out, postponed and cancelled fixtures remain visible, and rollout operations are documented below.

## Local setup

1. Install Node.js and the Supabase CLI.
2. Copy `.env.example` to `.env.local`.
3. Set the Supabase URL and publishable key. Keep the secret key server-only.
4. Run `npm install`.
5. Run `npm run dev`.

To apply migrations and seed data against a local Supabase project, run `npm run db:seed`.

The Google OAuth provider and redirect URL must also be enabled in the Supabase dashboard. The callback URL is `/callback` on the configured application origin.

## Hosted Supabase setup

For a Supabase project created on the web, use the hosted migration flow instead of `npm run db:seed`:

```powershell
supabase init
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --include-seed
```

The project reference is the identifier in the Supabase project URL. `supabase link` may ask for the database password. `db push --include-seed` applies the migration in `supabase/migrations` and the configured `supabase/seed.sql` data. Do not use `supabase db reset` against the hosted project.

If `db push --include-seed` applies the migration but cannot seed because Docker Desktop is unavailable, run the seed directly through the linked database:

```powershell
npx supabase db query --linked --file supabase/seed.sql
```

In the Supabase dashboard, copy the Project URL and publishable key from the API settings into `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
ADMIN_SYNC_SECRET=YOUR_LONG_RANDOM_ADMIN_SECRET
SPORTS_CRON_SECRET=YOUR_LONG_RANDOM_CRON_SECRET
SPORTS_SYNC_ENABLED=false
GEMINI_API_KEY=YOUR_SERVER_ONLY_GEMINI_API_KEY
```

The Supabase secret key and `GEMINI_API_KEY` are server-only, should never be committed, and are not sent to the browser. Gemini briefings remain unavailable (while all deterministic statistics still work) until the key is configured. In Authentication settings, enable Email. Under URL Configuration, set the Site URL to `http://localhost:3000` and add `http://localhost:3000/callback` to the redirect allow list.

`SPORTS_CRON_SECRET` protects `POST /api/cron/sports-sync`. Configure your scheduler to send it as the `x-sports-cron-secret` header. The route accepts `{"dryRun":true}` for a read-only due-work report. It uses the existing service-role lease table to prevent overlapping scheduler invocations; Supabase Cron, Vercel Cron, or another server-side scheduler may invoke this route.

Keep `SPORTS_SYNC_ENABLED=false` through rollout. The protected cron route remains available for dry runs while disabled and returns `503` for live writes. Enable it only after the checklist below passes; the manual admin sync route remains the emergency operator path.

### Automatic scheduled sync

The migration `20260712081439_schedule_sports_sync.sql` schedules Supabase Cron to call the protected due-work route every minute. The route still enforces the lease, quota, retry, provider-error, and `SPORTS_SYNC_ENABLED` safeguards; a disabled deployment receives `503` without writing provider data.

After the production app is deployed and the migration is pushed, provision the two Vault secrets once in the linked Supabase SQL editor. Use the production app URL without a trailing slash and the same random value configured as the production `SPORTS_CRON_SECRET`; do not commit either value:

```sql
select vault.create_secret('https://your-production-app.example.com', 'called_it_app_url');
select vault.create_secret('YOUR_SPORTS_CRON_SECRET', 'called_it_sports_cron_secret');
```

Then enable live writes in the production app environment:

```dotenv
SPORTS_SYNC_ENABLED=true
```

Apply the scheduler migration and verify its runs:

```powershell
npx supabase db push
npx supabase db query --linked "select jobid, jobname, schedule, active from cron.job where jobname = 'called-it-sports-sync';"
npx supabase db query --linked "select jobid, status, return_message, start_time, end_time from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'called-it-sports-sync') order by start_time desc limit 10;"
npx supabase db query --linked "select id, status_code, error_msg, created from net._http_response order by created desc limit 10;"
```

The first scheduled call may return `503` until the production environment has `SPORTS_SYNC_ENABLED=true`, `FOOTBALL_DATA_API_TOKEN`, `FOOTBALL_DATA_COMPETITION`, and `FOOTBALL_DATA_SEASON`. To stop automatic writes, set `SPORTS_SYNC_ENABLED=false` or unschedule the job:

```sql
select cron.unschedule(jobid) from cron.job where jobname = 'called-it-sports-sync';
```

### Phase 0 sports-provider verification

Live sports sync is intentionally disabled until the intended football-data.org competition is verified. Add these server-only values to `.env.local`:

```dotenv
FOOTBALL_DATA_API_TOKEN=YOUR_FOOTBALL_DATA_TOKEN
FOOTBALL_DATA_BASE_URL=https://api.football-data.org/v4
FOOTBALL_DATA_COMPETITION=YOUR_COMPETITION_CODE_OR_ID
FOOTBALL_DATA_SEASON=2026
```

Run the non-destructive verification command:

```powershell
npm run sports:verify
```

To inspect specific completed fixtures for score duration, goals, own goals, and lineup semantics without printing raw provider payloads:

```powershell
npm run sports:verify -- --fixtures=FIXTURE_ID_1,FIXTURE_ID_2
```

The command reports competition metadata, a date-window fixture summary, available match data capabilities, team/squad counts, request-budget headers, and sanitized contract summaries. It never writes to Supabase and never prints API tokens. Competition codes such as `PL`, `WC`, and `CL` are supported; use the code or numeric ID shown by football-data.org.

To enable Google, create a Web OAuth client in Google Cloud, add the Supabase provider callback URI shown on the Supabase Google provider page to Google's authorized redirect URIs, then paste the Google client ID and secret into Supabase Auth. The application still redirects back to `http://localhost:3000/callback` after Supabase completes OAuth.

## Testing locally

### UI smoke test

The landing page and auth screens can be viewed without Supabase credentials:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`, then check the landing page, `/login`, and `/signup` at mobile and desktop widths. Auth submission requires the environment setup below.

### Auth and database test

For a local Supabase instance:

```powershell
supabase init
supabase start
npm run db:seed
```

Copy `.env.example` to `.env.local`, then set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the values printed by `supabase status`. Start the app with `npm run dev` and verify:

1. Signing up creates an account and redirects to the dashboard.
2. Signing in with email/password opens `/dashboard`.
3. Visiting `/dashboard` while signed out redirects to `/login`.
4. The OAuth callback is available at `/callback`.
5. `/friends` searches profiles and supports sending, accepting, rejecting, cancelling, removing, and blocking friendship requests.
6. `/leaderboard` switches between global and accepted-friends rankings.
7. `/profile` shows the signed-in user's ranking and prediction statistics.
8. A fully correct processed prediction appears as a Called It card on `/profile`; its public URL at `/cards/[publicSlug]` exposes only verified card details.
9. Correcting a result that invalidates a card revokes its public URL and removes it from the active collection.
10. With `GEMINI_API_KEY` configured, `/profile` can generate a personal briefing and the friends leaderboard can generate a recap. Both use only stored, verified aggregate statistics.

Google OAuth requires enabling the provider and adding `http://localhost:3000/callback` to the Supabase redirect URLs. The `db:seed` script resets a local database; do not run it against production data.

### Automated checks

Run the foundation checks with:

```powershell
npm run lint
npm run typecheck
npm run build
```

`npm run test` runs the scoring and validation suite. Hosted integration coverage should verify the Phase 3 friendship RPCs and leaderboard functions after the migration is pushed.

### Phase 7 rollout and operations runbook

Run these secret-free checks with the linked Supabase CLI after migrations are applied. They inspect counts and state only; they do not print keys.

```powershell
# Active configured competitions and due fixtures
npx supabase db query --linked "select (select count(*) from public.tournaments where provider = 'football-data' and sync_enabled = true) as active_competitions, (select count(*) from public.matches where provider = 'football-data' and status <> 'cancelled' and next_sync_at is not null and next_sync_at <= now()) as due_fixtures;"

# Terminal candidates waiting for confirmation
npx supabase db query --linked "select id, external_id, status, result_processing_status, result_candidate_observations, result_candidate_seen_at from public.matches where status = 'finished' and result_processing_status in ('candidate', 'processing') order by result_candidate_seen_at nulls first;"

# Manual-review or failed fixtures
npx supabase db query --linked "select id, external_id, status, result_processing_status, sync_last_error_code, next_sync_at from public.matches where result_processing_status in ('manual_review', 'failed') order by next_sync_at nulls first;"

# Active, expired, or overlapping leases
npx supabase db query --linked "select lease_key, holder_id, acquired_at, expires_at, expires_at <= now() as expired from public.sports_sync_leases order by lease_key;"

# Recent runs and provider usage
npx supabase db query --linked "select id, trigger_type, scope, status, started_at, finished_at, fixture_count, provider_request_count, provider_quota, error_code from public.sports_sync_runs order by started_at desc limit 20;"

# Predictions that do not match the current result version
npx supabase db query --linked "select prediction.id, prediction.match_id, prediction.scored_result_version, match.result_version from public.predictions prediction join public.matches match on match.id = prediction.match_id where prediction.scored_result_version is distinct from match.result_version;"

# Duplicate active cards or notification dedupe keys
npx supabase db query --linked "select prediction_id, count(*) from public.called_it_cards where revoked_at is null group by prediction_id having count(*) > 1;"
npx supabase db query --linked "select dedupe_key, count(*) from public.notifications where dedupe_key is not null group by dedupe_key having count(*) > 1;"

# Browser roles must not have grants on server-managed sports tables/functions
npx supabase db query --linked "select table_name, grantee, privilege_type from information_schema.role_table_grants where table_schema = 'public' and table_name in ('match_players', 'match_events', 'sports_sync_runs', 'sports_sync_leases') and grantee in ('anon', 'authenticated') order by table_name, grantee, privilege_type;"
npx supabase db query --linked "select routine_name, grantee, privilege_type from information_schema.routine_privileges where routine_schema = 'public' and routine_name = 'acquire_sports_sync_lease' and grantee in ('anon', 'authenticated') order by routine_name, grantee;"
```

Rollout sequence: keep sync disabled, run the dry import and checks, enable manual sync, inspect `sports_sync_runs`, configure the scheduler, observe one pre-match → live → confirmed lifecycle, and then set `SPORTS_SYNC_ENABLED=true`. Roll back by disabling the flag and scheduler; imported data, scored predictions, seeded demo records, and manual processing remain intact.
