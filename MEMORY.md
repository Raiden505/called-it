# Called It Project Memory

This file is the concise implementation ledger for the Called It project. It records durable facts, decisions, completed work, validation, and follow-up items so future changes can be made safely.

## Current state

- Repository baseline contains the product requirements in `called-it-prd.md` and the implementation reference in `called-it-technical-design.md`.
- Phase 1 local foundation is implemented: Next.js application shell, auth routes, Supabase clients, middleware, migrations, seed data, and package tooling are present.
- Supabase CLI `2.109.1` is pinned as a dev dependency and `supabase/config.toml` is initialized for hosted linking and local development.
- Supabase clients accept the modern `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` names, with legacy anon/service-role fallbacks for compatibility.
- Vitest covers the Phase 2 scoring and UUID-boundary rules; authenticated integration and end-to-end tests remain open.
- No dedicated `called-it-tdd.md` exists. Until one is added, `called-it-technical-design.md` is the technical design document (TDD) used for implementation guidance.
- `AGENTS.md` defines the required read → plan → test → implement → validate → record workflow.
- Implementation status: Phase 3 social/leaderboard, Phase 4 Called It cards, and Phase 5 grounded Gemini summary infrastructure are deployed. Live Gemini generation is verified locally with the configured server-side `GEMINI_API_KEY`; deployed environments must configure their own server-only key.
- Current hosted connection state: `.env.local` contains the project URL, publishable key, secret key, and admin sync secret; the hosted schema, seed data, prediction RPC, and Phase 2 result flow are deployed.
- Phase 2 local and hosted state: match list, prediction form, atomic submission RPC, scoring core, and result-processing endpoint are implemented; the hosted submission RPC and schema are deployed.
- Phase 3 local state: friend search/actions, restricted friendship RPCs, global/friends leaderboard RPCs, profile stats RPC, and their responsive pages are implemented. The migration is source-controlled at `supabase/migrations/20260710135921_social_leaderboards.sql`.
- Phase 4 local and hosted state: result processing issues/revokes server-owned Called It cards, profile collections and public card pages are available, and card sharing/visibility controls are implemented. The migration is source-controlled at `supabase/migrations/20260711101124_called_it_card_lifecycle.sql`.
- Phase 5 local and hosted state: personal and friends-recap briefing panels, structured Gemini service, JSON validation, cache hashes, cooldowns, loading/error states, optional-key fallback, and transactional sports result processing are implemented. The cache migration is source-controlled at `supabase/migrations/20260711105035_ai_summary_cache.sql`.
- The next implementation phase is specified in `called-it-live-data-profile-implementation-plan.md`: football-data.org fixture/goal/lineup/squad sync, Supabase Cron orchestration, stable automatic result and Called It processing, result-correction handling, and required profile onboarding/editing. This is a plan only; none of those runtime changes are implemented yet.
- Phase 1 sports sync foundation is now implemented locally: football-data.org response schemas, normalized provider contracts, retrying server-only client, lifecycle/score/goal normalizer, idempotent sync service, protected admin sync route, and source-controlled Supabase sync migration. Phase 3 competition/squad/pre-match sync is complete. Phase 4 scheduled due-work orchestration is implemented locally with result-priority quota selection, bounded batches, protected cron execution, exponential retry scheduling, and last-known-good preservation. Phase 5 stable result confirmation, transactional result application, deterministic scoring, and Called It synchronization are implemented and deployed. Phase 6 profile onboarding/editing is implemented and the completeness migration is deployed; authenticated visual smoke coverage remains open. Phase 7 matchday UI integration is implemented locally with freshness/lifecycle states, authorized server-read refresh, postponed/cancelled fixture visibility, and rollout gating for live cron writes.
- Complete UI revamp is implemented locally: dark match-night tokens, lime signal palette, condensed display/body typography stacks, shared responsive app rail/bottom navigation, redesigned landing/auth/reset/onboarding/dashboard/matchdesk/prediction/ranking/friends/profile/Called It surfaces, and accessible loading/error/empty/status treatments are in place. The implementation preserves existing server actions, RLS, prediction privacy, kickoff locking, scoring, result processing, card lifecycle, and sports freshness behaviour.
- Provider decision superseding the original TDD choice: use football-data.org API v4. The TDD and plan now treat the provider as an abstraction with football-data.org as the active implementation target.

## Source-of-truth summary

- Product: `called-it-prd.md`.
- Technical implementation: `called-it-technical-design.md`.
- Process and repository rules: `AGENTS.md`.
- If sources conflict, follow the precedence documented in `AGENTS.md` and record the decision here.

## MVP scope

The MVP must support account creation and profiles, favourite-team selection, friend requests and friends, upcoming/completed matches, score and first-goalscorer predictions, confidence multipliers, prediction locking at kickoff, automatic scoring, global and friends-filtered leaderboards, basic statistics, Called It cards, responsive mobile/desktop UX, seeded demo reliability, and a grounded Google Gemini summary feature.

The PRD also mentions Snowflake analytics, while the TDD explicitly lists Snowflake as a non-goal for the MVP. Current decision: defer Snowflake and use the TDD weekend scope unless the product owner explicitly changes the scope.

Excluded unless explicitly approved: private leagues, real-money betting, cryptocurrency/Solana, ElevenLabs audio, live chat, user-created posts, complex comments, native apps, event-by-event predictions, paid advantages, and a Called It marketplace.

## Technical baseline

- Next.js App Router with TypeScript and Tailwind CSS.
- Supabase Postgres, Auth, Row Level Security, and optional Storage.
- Next.js server actions and route handlers in a modular monolith.
- Zod for runtime validation.
- football-data.org API v4 behind a provider abstraction, with seed/demo fallback.
- Google Gemini through `@google/genai` for structured, grounded summaries only.
- Vitest for unit tests and Playwright for end-to-end smoke tests.
- Vercel as the primary deployment target.

## Non-negotiable invariants

- Prediction locking uses server time and server/database enforcement; frontend controls are not security boundaries.
- Predictions stay private before kickoff.
- Clients cannot edit scoring-owned fields or manually create Called It cards.
- Scoring and ranking are deterministic and server-owned.
- Result processing is idempotent.
- Confidence allowance validation is safe under concurrent requests.
- Public Called It pages reveal no private information.
- Seeded demo behavior remains available if external sports APIs fail.

## Planned implementation order

1. Foundation: Next.js app, styling, Supabase clients, authentication, migrations, and seed data.
2. Core prediction loop: match list, prediction form, validation, confidence limits, locking, scoring, and result processing.
3. Social and rankings: user search, friendship transitions, leaderboards, friends filter, and profile statistics.
4. Called It: eligibility, card records, public pages, sharing metadata, and rarity.
5. AI and polish: Gemini summaries, loading/error/empty states, responsive refinement, demo scenario, and end-to-end smoke tests.

## Completed work log

### 2026-07-12 — Product-flow upgrade Phase 0 started

- Added pure Phase 0 contract modules and tests for recent-outcome curation, result presentation states, Match Desk filter parsing, and adaptive refresh intervals.
- Added `phase-0-baseline.md` with responsive screenshot references, source-level query counts/payload shape observations, and the current prediction RLS invariant review.
- Captured unauthenticated landing screenshots at 375px, 768px, and 1440px. Hosted `pg_policies` verification confirmed all four prediction policies and their live owner/friend/kickoff expressions. Authenticated two-user behavioral RLS coverage remains unverified because no test session was available.
- Validation: the four new suites initially failed at missing contract imports as expected, then passed with 9 tests; `npm run typecheck` passed. No schema, query, or live RLS behavior was changed.
- Follow-up: Phase 1 should split Match Desk/detail/archive queries, add measured query/payload instrumentation, and run authenticated owner/friend RLS integration coverage.

### 2026-07-12 — Product-flow upgrade Phase 1 query split implemented

- Added bounded `getMatchDeskForUser`, single-match `getMatchDetailsForUser`, and stable paginated `getResultsArchiveForUser` contracts in `lib/matches/queries.ts`. The legacy `getMatchesForUser` now delegates to the bounded desk read for compatibility.
- Match reads now select result version/confirmation/processing timestamps and prediction point breakdown/version fields. The view model exposes a deterministic `resultPresentation` state so confirmed results without a user prediction are not mislabeled as recalculating.
- Wired `/matches` to the Match Desk contract, showing upcoming/live fixtures, at most three curated recent outcomes, and fixture updates instead of rendering every finished match returned by the old query.
- Updated match cards/status/form types to consume summary or detail view models while preserving the existing inline prediction editor for scheduled fixtures. No migration or RLS policy change was needed.
- Validation: 18 test files and 61 tests passed; `npm run lint`, `npm run typecheck`, and `npm run build` passed. The build retains the existing Next.js middleware deprecation warning. Hosted query execution was not changed.
- Follow-up: Phase 2 should add the `/matches/results` archive UI, URL-backed filters, compact result rows, and explicit pagination controls. Phase 3 should move player hydration/editor work fully into match detail.

### 2026-07-12 — Match Desk empty-state ordering bug fixed

- Root cause: the bounded `view: "all"` desk query sorted all matches oldest-first before applying its 40-row limit. The hosted project has 104 finished matches and only 3 scheduled matches, so the query returned old finished rows; curation correctly discarded them as too old, leaving every visible desk section empty.
- Changed the desk read to fetch upcoming/live fixtures ascending and finished/postponed/cancelled fixtures descending in separate bounded buckets, then merge them before hydration. This preserves the upcoming window and recent-outcome window independently.
- Hosted read-only verification confirmed 3 scheduled and 104 finished matches, and all scheduled team references/selected result columns exist.
- Validation: 18 test files and 62 tests passed; `npm run typecheck` and `npm run lint` passed. No schema, RLS, or provider data changes were made.

### 2026-07-12 — Product-flow upgrade Phase 2 results archive implemented

- Added protected `/matches/results` with newest-first results, stable 20-row pagination, previous/next navigation, and filter state preserved in URL parameters.
- Added authenticated archive filters for My predictions/All results, team, stage, date range, and processing status. The default scope is owner predictions, and the query uses owner-scoped prediction IDs so private prediction data remains protected by existing RLS.
- Added compact `ResultRow` presentation with score, match metadata, honest processing state, and expandable deterministic point breakdowns when the result version matches. Unconfirmed or recalculating points remain hidden.
- Added archive team options, Match Desk links to the archive, distinct empty states for no calls/no results versus filters matching nothing, and focused filter/pagination tests.
- No database migration or RPC was required. Validation: 19 test files and 66 tests passed; `npm run lint`, `npm run typecheck`, and `npm run build` passed. The build retains the existing Next.js middleware deprecation warning. Authenticated visual smoke remains unverified because no browser test session is available.
- Follow-up: Phase 3 should add protected `/matches/[matchId]`, move player hydration into focused detail reads, and make scheduled cards use one-at-a-time prediction editing.

### 2026-07-11 — Phase 1 sports sync foundation started

- Added `lib/sports/` provider contracts, football-data.org v4 Zod schemas/client/provider, status mapping, normalized fixture/team/squad/goal-event handling, and focused normalization tests.
- Added `lib/sports/sync-service.ts` for server-side competition upserts, team/player/match/event persistence, match-player squad snapshots, and sync-run success/failure audit updates.
- Added protected `POST /api/admin/sports-sync`, using `ADMIN_SYNC_SECRET` and server-only `FOOTBALL_DATA_*` variables.
- Added migration `supabase/migrations/20260711174356_sports_provider_sync_foundation.sql` with provider identity separation, lifecycle/result candidate fields, `match_players`, `match_events`, `sports_sync_runs`, `sports_sync_leases`, indexes, explicit service-role grants, RLS, and a service-role-only lease RPC.
- Validation: focused sports tests passed; full suite passed with 5 files and 16 tests; `npm run lint` and `npm run typecheck` passed. Hosted migration push and live provider sync are not yet verified.
- Follow-up: review and push the migration to the linked Supabase project, then add stable result confirmation and automatic result/card processing before enabling scheduled sync.

### 2026-07-12 — Live sync 502 diagnosed and fixed

- Root cause: football-data.org returned valid future knockout fixtures with unresolved placeholder teams (`homeTeam`/`awayTeam` IDs and names set to null). The strict match schema rejected the full response, producing the route's 502.
- Secondary performance issue: synchronizing all 48 team squads sequentially exceeded the practical request duration on the provider's free quota.
- Changed match validation/provider handling to accept and skip unresolved placeholder fixtures until their teams are known, and made squad hydration opt-in via `FOOTBALL_DATA_SYNC_SQUADS=true` (default false) so the base fixture sync remains fast.
- Validation: real football-data.org verification succeeded; optimized local protected sync returned HTTP 200 with 101 fixtures, 48 teams, 0 players, and 0 events; typecheck and all 16 tests passed.
- Follow-up: add a separately scheduled, quota-aware squad refresh and then implement stable result confirmation/automatic scoring and Called It processing.

### 2026-07-12 — Phase 2 provider adapter and normalizers completed

- Added `ResultCandidate` and `normalizeResultCandidate` with canonical SHA-256 hashes, regular-time score requirements, 0–0/goal conflict checks, earliest-goal selection, own-goal handling, and manual-review gates for incomplete extra-time/shootout semantics.
- Corrected non-regular fixture normalization so `score90` is not inferred from halftime data.
- Added a reusable `FakeSportsProvider`, full status mapping tests, result-candidate edge-case tests, malformed-payload tests, retry/no-retry client tests, and transient-error handling that classifies HTTP status before parsing the body.
- Validation: 8 test files and 34 tests passed; `npm run lint` and `npm run typecheck` passed. The optional live verifier remains available for provider contract checks.
- Follow-up: Phase 3 competition/squad/pre-match sync improvements, including separate quota-aware squad refresh and lifecycle-safe kickoff updates.

### 2026-07-12 — Phase 3 sync safeguards started

- Added `lib/sports/sync-policy.ts` to preserve prediction closure and the original kickoff after a match has started, accept pre-kickoff schedule corrections, and reopen postponed fixtures only when a new future kickoff is supplied.
- Wired the policy into `lib/sports/sync-service.ts`; event imports now also resolve provider player IDs when available, and the sync service supports a read-only `dryRun` summary.
- Added a database lease acquisition/release around `POST /api/admin/sports-sync` using the existing service-role-only `acquire_sports_sync_lease` RPC. The route accepts `{ "dryRun": true }` without acquiring a lease or writing.
- Validation: 9 test files and 38 tests passed; `npm run typecheck` and `npm run lint` passed.
- Remaining Phase 3 work: add quota-aware squad/lineup snapshots, scheduled due-work orchestration, hosted lease verification, and profile onboarding/editing. The current service still performs per-row writes and does not yet expose provider request telemetry or retry scheduling.

### 2026-07-12 — Phase 3 competition/squad/pre-match sync completed

- Extended football-data.org match schemas and normalization for unfolded starting lineups and benches. Added normalized match-player snapshots with `starter` and `substitute` roles.
- Updated the sync service to upsert provider players and `match_players` after squad hydration, preserving lineup roles on repeated imports. Provider event player IDs are resolved to internal player UUIDs when available.
- Missing provider fixtures remain untouched; the importer only upserts fixtures returned by the provider and performs no destructive deletes. Existing provider/seed identity separation and unique indexes preserve idempotency and prevent cross-provider collisions.
- Hosted read-only verification succeeded: 1 football-data tournament, 48 teams, 101 matches, 1,249 players, 5,255 match-player snapshots, 7 sync runs, and 0 active leases. The lease RPC is present and executable only by `service_role`.
- Validation: 9 test files and 39 tests passed; `npm run typecheck` and `npm run lint` passed.
- Follow-up: begin Phase 4 scheduled due-work sync with quota policy, protected cron route, bounded batches, retry scheduling, and provider-outage last-known-good behavior.

### 2026-07-12 — Phase 4 scheduled due-work sync implemented

- Added `lib/sports/quota-policy.ts` for due-work filtering, finished-result prioritization, configurable run/batch caps, status-based refresh intervals, and capped exponential retry times.
- Added `lib/sports/due-work-service.ts` to select due provider matches, process bounded fixture batches through the normalized provider boundary, leave existing match facts unchanged during provider failures, and schedule retries for missing/failed fixtures.
- Added protected `POST /api/cron/sports-sync`, using `SPORTS_CRON_SECRET` with `ADMIN_SYNC_SECRET` compatibility, the existing service-role lease RPC, and optional dry-run mode. Documented the scheduler contract in `README.md` and added `SPORTS_CRON_SECRET` to `.env.example`.
- Validation: 10 test files and 42 tests passed; `npm run typecheck` passed; lint passed after removing an unused import. Hosted schema already contains the required run/lease tables, so no migration was needed.
- Remaining Phase 4 operational step: configure a production scheduler to call the route with `x-sports-cron-secret`; Phase 5 will add automatic result confirmation and scoring.

### 2026-07-12 — Phase 5 automatic result flow started

- Added `lib/sports/result-confirmation.ts` with a two-observation, 90-second stable-hash gate and reset behavior when provider result candidates change. Manual-review and not-ready candidates cannot be scored automatically.
- Connected confirmed candidates in `lib/sports/due-work-service.ts` to the existing server-side deterministic `processMatchResult` flow, including provider player/team ID resolution, scoring, Called It synchronization, correction-compatible result versions, and retry/manual-review states.
- Due-work selection now excludes processed/manual-review matches and reports `resultsProcessed`; result candidate state is persisted in the existing hosted `matches` lifecycle columns.
- Hosted read-only verification succeeded for the result-processing columns and leases: 0 processed, 0 pending candidates, 0 manual reviews, 0 failed results, and 0 active leases at verification time. No live terminal candidate had been observed yet, so end-to-end scheduled result processing remains unverified.
- Validation: 11 test files and 45 tests passed; `npm run typecheck` and `npm run lint` passed.
- Phase 5 implementation is complete. A disposable correction-with-predictions smoke remains optional follow-up; production scheduler configuration remains operational setup.

### 2026-07-12 — Phase 5 transactional result processing completed

- Added migration `supabase/migrations/20260711230043_transactional_result_processing.sql` with service-role-only `apply_processed_match_result`, row locking, stale result-version rejection, atomic prediction scoring updates, match result updates, Called It issue/revoke/reissue behavior, and deduplicated result notifications.
- Added follow-up migration `supabase/migrations/20260711230916_fix_result_notification_conflict.sql` to use a full nullable unique notification dedupe index compatible with PostgreSQL `ON CONFLICT` inference.
- Refactored `lib/scoring/process-result.ts` to calculate deterministic scores in TypeScript and apply all server-owned writes through the RPC. Automatic provider result processing passes the stable candidate hash.
- Hosted deployment succeeded. Read-only verification confirms the RPC is executable by `service_role` only and the notification dedupe index exists. Hosted idempotency smoke applied the existing seeded finished result twice; the match remained at `result_version = 1`, `result_processing_status = 'processed'`, and retained the candidate hash.
- Validation: 11 test files and 45 tests passed; `npm run typecheck`, `npm run lint`, Supabase security advisors, migration push, and hosted idempotency smoke passed. The smoke used an existing no-prediction demo match; a disposable correction-with-predictions smoke remains optional follow-up.
- Next phase: profile onboarding and editing, including completeness enforcement.

### 2026-07-12 — Phase 6 profile onboarding and editing implemented

- Added `supabase/migrations/20260711231818_profile_onboarding_completeness.sql` with `onboarding_completed_at`, username/display-name constraints, favourite-team index, and a server-side completeness trigger. The migration was applied to the linked Supabase project and the trigger/index were verified read-only.
- Added shared profile validation, selectable active-competition teams, ownership-checked server action updates, unique-username error handling, and revalidation for profile/social/card surfaces.
- Added central middleware enforcement: incomplete authenticated users are routed to `/onboarding`, complete users opening onboarding are sent to `/profile/edit`, and requested same-origin destinations are preserved after completion.
- Added the responsive matchday identity-card onboarding UI and profile editor with required identity/crest fields, optional bio/country/visibility/searchability settings, keyboard-visible radio team selection, and mobile-friendly layout. The frontend design direction uses the existing Called It acid-lime/broadcast palette with a single dark match-ticket hero surface.
- Validation: 12 test files and 47 tests passed; `npm run typecheck` and `npm run lint` passed. Browser smoke verified unauthenticated `/onboarding` routes to `/login`; authenticated onboarding/edit visual smoke remains unverified because no test session was available.
- Remaining follow-up: run an authenticated browser smoke at 375px, 768px, and 1440px, then continue with rollout/observability polish.

### 2026-07-12 — Phase 7 UI integration completed

- Added lifecycle and freshness labels for scheduled, live, finished/pending, confirmed, postponed, and cancelled matches. Match cards now expose provider freshness and local sync time without relying on colour alone.
- Wired `MatchesRefresh` into the matchday desk with a manual refresh action, an accessible live status message, and a one-minute authenticated `router.refresh()` loop. The read path remains server-side and RLS-protected.
- Extended the match query to include `last_synced_at` and `result_processing_status`, and kept postponed/cancelled provider fixtures visible in a dedicated fixture-updates section.
- Added `SPORTS_SYNC_ENABLED=false` rollout gating to the cron write path; dry-run requests remain available while disabled. Added the Phase 7 README runbook with secret-free operational queries, rollout order, and rollback guidance.
- Validation: 14 test files and 52 tests passed; `npm run typecheck`, `npm run lint`, and `npm run build` passed. The build retains the existing Next.js middleware deprecation warning. Authenticated visual/Playwright coverage remains unverified because this repository has no Playwright harness or reusable test session, and the local dev server did not stay available for the attempted HTTP smoke.
- Security/operations decision: no Supabase Realtime publication or migration was added; the UI refreshes authorized server reads to avoid broadening table exposure or relying on an unverified publication configuration.

### 2026-07-12 — Complete UI revamp implementation plan documented

- Added `called-it-ui-revamp-implementation-plan.md` before any UI code changes. It defines a dark match-night visual direction that retains the acid-lime signal colour, replaces Arial with Barlow Condensed and Manrope, and uses a restrained match-ticket rail as the product signature.
- The plan covers the existing route inventory, all MVP privacy/locking/scoring/freshness invariants, responsive navigation at mobile/tablet/desktop breakpoints, component architecture, accessibility, performance, data additions, and seven build/verification phases.
- It explicitly separates visual work from PRD-completeness additions that require server-side contracts: dashboard aggregates, match filters, point breakdown/history, password reset, and settings/notification capabilities. No schema, server, provider, security, or UI runtime code changed.
- Validation: Markdown structure checked (250 lines; headings/tables present). No test suite run because this change is planning documentation only.

### 2026-07-12 — Complete UI revamp implemented

- Replaced the light/Arial presentation with a layered near-black match-night system using semantic dark surfaces, acid-lime action/verification signals, lifecycle status colours with text/dot reinforcement, focus-visible rings, safe-area mobile spacing, and reduced-motion rules. The intended Barlow Condensed/Manrope direction now uses local-safe `Bahnschrift Condensed`/`Arial Narrow`/`Impact` and `Trebuchet MS`/`Segoe UI` fallbacks so production builds do not fetch Google Fonts at build time.
- Added the shared authenticated shell with desktop rail, tablet-safe layout, and mobile bottom navigation; added reusable page headers, buttons, notices, empty states, ticket rails, match status rails, and dark form treatments.
- Rebuilt the landing page, authentication forms, password-reset request page, dashboard command centre, match desk, prediction controls, leaderboard rows, friends sections, profile record, Gemini briefing panel, onboarding form presentation, Called It cards, sharing controls, and card visibility actions.
- Added no database migrations and did not change scoring, prediction deadlines, privacy, RLS, provider sync, result processing, or server-owned card behaviour. Dashboard/match-filter/history enhancements remain documented as future backend-backed additions rather than simulated client data.
- Validation: `npm run lint` passed; `npm test -- --run` passed with 14 files and 52 tests; `npm run typecheck` passed; `npm run build` passed. The existing Next.js middleware deprecation warning remains. Browser smoke confirmed the landing page at 375px and 1440px and confirmed unauthenticated `/matches` redirects to `/login?next=%2Fmatches`; authenticated route visual coverage remains unverified because no reusable signed-in browser session is available.

### 2026-07-12 — Match score controls aligned

- Updated the increment/decrement controls in `components/matches/prediction-form.tsx` to match the rest of the dark UI: `rounded-xl` geometry, raised surface, consistent border, display font, lime hover/focus signal, and disabled decrement state at zero.
- Prediction behaviour and server-side validation are unchanged.
- Validation: `npm run typecheck`, `npm run lint`, and `npm test -- --run` passed; 14 test files and 52 tests remain green.

### 2026-07-12 — Native score spinners removed

- Added the scoped `score-input` styling to remove browser-native up/down spinner arrows from the home/away goal fields while retaining keyboard numeric entry and the custom increment/decrement controls.
- Validation: `npm run typecheck`, `npm run lint`, and `npm test -- --run` passed; 14 test files and 52 tests remain green.

### 2026-07-12 — Product-flow upgrade implementation plan documented

- Added `called-it-product-flow-upgrade-implementation-plan.md` after auditing Match Desk result rendering and similar information-hierarchy issues across Dashboard, prediction editing, freshness, navigation, Rankings, Friends, Profile, Cards, and post-kickoff friend prediction visibility.
- The plan defines a curated default Match Desk with at most three personalized recent outcomes, a full paginated results archive, protected match detail, compact prediction editing, real URL filters, real dashboard data, local-time/server-lock handling, adaptive refresh, active navigation/sign-out, table-first rankings, consequence-aware friendship actions, paginated history/card collections, and existing-RLS friend prediction reveal.
- Technical detail includes result presentation/version state machines, summary/detail/archive TypeScript contracts, Supabase query/RPC/index boundaries, explicit grant/RLS requirements, nine implementation phases plus Phase 0 tests, integration/E2E matrices, observability, rollout, rollback, and definition of done.
- No application code, migration, hosted data, environment configuration, or runtime behaviour changed. Validation: Markdown structure checked (405 lines; required contracts, phases, tables, and security checklist present). No test suite run because this change is planning documentation only.

### 2026-07-12 — Automatic sports sync scheduler added

- Added `supabase/migrations/20260712081439_schedule_sports_sync.sql`, which enables `pg_net`/`pg_cron` and schedules a once-per-minute Supabase Cron job to POST to `/api/cron/sports-sync`.
- The scheduled command reads `called_it_app_url` and `called_it_sports_cron_secret` from Supabase Vault at execution time. No URL or secret is stored in source control or migration text. The existing lease, quota, retry, result-confirmation, and `SPORTS_SYNC_ENABLED` safeguards remain authoritative.
- Documented one-time Vault provisioning, production flag activation, migration push, run inspection, HTTP response inspection, and rollback in `README.md`.
- Validation: 14 test files and 52 tests passed; `npm run typecheck`, `npm run lint`, and `npm run build` passed. Hosted migration push and live cron verification remain unverified because the Supabase CLI session is not authenticated in this workspace.

### 2026-07-10 — Repository guidance and initial memory created

- Added `AGENTS.md` with the required pre-implementation document review, TDD/test workflow, product constraints, security invariants, and memory maintenance rules.
- Added this `MEMORY.md` as the initial project ledger.
- Reviewed `called-it-prd.md` and `called-it-technical-design.md` to establish the scope, architecture, testing priorities, and the Snowflake MVP scope decision.
- Validation: documentation consistency review completed; no application tests exist yet.

### 2026-07-10 — Phase 1 local foundation scaffolded

- Added the Next.js App Router foundation with TypeScript, Tailwind CSS, metadata, landing page, and responsive auth/dashboard shells.
- Added email/password and Google OAuth flows, the `/callback` Supabase session exchange route, protected-route session middleware, and separate browser/server/admin Supabase clients.
- Added `.env.example`, package scripts, ESLint, TypeScript, Vitest, and a setup README. Dependency installation produced `package-lock.json`.
- Added the initial Supabase schema for profiles, friendships, tournaments, teams, players, matches, predictions, confidence allocations, Called It cards, notifications, and AI summaries.
- Added profile onboarding trigger, RLS policies, canonical friendship-pair uniqueness, and a database trigger preventing authenticated clients from modifying server-owned prediction/scoring fields.
- Restricted the auth callback return path to same-origin paths to prevent open redirects.
- Added deterministic demo tournament, team, player, upcoming-match, and completed-match seed records in `supabase/seed.sql`.
- Validation: `npm run lint`, `npm run typecheck`, and `npm run build` pass. The build reports Next.js's deprecation warning for the `middleware.ts` convention. Supabase migration/seed execution is unverified because the Supabase CLI and project credentials are not available locally.

### 2026-07-10 — Local testing guidance documented

- Added UI smoke-test, local Supabase setup, auth verification, and automated-check instructions to `README.md`.
- Validation: `npm run test` is configured but currently exits with `No test files found`; feature tests are intentionally deferred to Phase 2.

### 2026-07-10 — Hosted Supabase setup documented

- Added the hosted-project workflow to `README.md`: initialize and link the Supabase CLI, push migrations and seed data with `supabase db push --include-seed`, configure environment variables, and allow the local callback URL.
- Explicitly documented that `npm run db:seed` runs `supabase db reset` and is for local databases, not the hosted project.

### 2026-07-10 — Hosted Supabase deployment prepared

- Installed and pinned Supabase CLI `2.109.1`; verified `link`, `db push`, and `init` command help with telemetry disabled.
- Initialized `supabase/config.toml` with `supabase init`; seed configuration points to `supabase/seed.sql`.
- Updated the prediction protection trigger to use `auth.uid()` with `SECURITY INVOKER`, avoiding the deprecated `auth.role()` check.
- Validation: CLI preparation is complete, but hosted linking, migration push, seed execution, advisors, and live test queries are blocked until a Supabase login and project reference are available.

### 2026-07-10 — Modern Supabase key compatibility verified

- Updated browser, server, middleware, environment template, README, and admin client configuration to prefer publishable/secret keys while accepting legacy anon/service-role names.
- Validation: lint, typecheck, and production build pass. A read-only query using the configured publishable key reached the hosted project, but returned `Could not find the table 'public.tournaments' in the schema cache`, confirming that migrations/seeds still need to be pushed.

### 2026-07-10 — Phase 2 core prediction loop implemented

- Added `calculateScore` as a pure deterministic scoring function with six unit tests covering outcome, goal difference, exact score, first goalscorer, own goals, 0–0 no-goalscorer, confidence multiplication, Called It eligibility, and regulation-time knockout scoring.
- Added protected `/matches` page, match queries, responsive score controls, first-goalscorer selector, no-goalscorer option, confidence chips, locked/live/result states, and prediction feedback.
- Added server-side Zod validation and the authenticated `submit_prediction` RPC. The RPC locks the match and multiplier rows, enforces server kickoff time, validates players and teams, supports pre-kickoff edits, and enforces three 2× plus one 3× allocation per tournament.
- Revoked direct authenticated prediction writes so clients must use the validated RPC.
- Added `/api/admin/process-results`, protected by `ADMIN_SYNC_SECRET`, to validate and process regulation-time results, recalculate all prediction scoring fields, and use `result_version` for idempotent corrections.
- Added `vitest.config.ts` for the `@/` alias and configured Phase 2 validation.
- Hosted deployment: pushed `20260710095453_submit_prediction_rpc.sql`; remote privilege query confirms direct prediction insert/update are denied while authenticated RPC execution is allowed.
- Validation: six scoring tests, lint, typecheck, and production build pass. The unauthenticated RPC smoke test was rejected. Remote seed counts remain 1 tournament, 4 teams, 4 players, and 2 matches.

### 2026-07-10 — Automated Phase 2 hosted smoke test

- Verified the local app automatically: home page returned `200`, unauthenticated `/matches` redirected with `307`, and the admin endpoint rejected a request without its secret with `401`.
- Created a disposable hosted Auth user and match, submitted a prediction through the authenticated RPC, processed the result through `/api/admin/process-results`, and verified `base_points = 8`, `total_points = 8`, and `scored_result_version = 1`.
- Cleanup verification returned zero leftover smoke-test users and matches.

### 2026-07-10 — Seeded UUID validation fixed

- Reproduced the prediction save error: Zod’s strict UUID validator rejected the seeded PostgreSQL IDs such as `00000000-0000-0000-0000-000000000202`, even though PostgreSQL accepts their UUID syntax.
- Added shared PostgreSQL UUID-shape validation for prediction and result inputs. The database RPC remains responsible for verifying that matches, players, and teams actually exist and are related correctly.
- Added regression tests for seeded-format UUID acceptance and malformed identifier rejection.
- Validation: 8 tests, lint, typecheck, and production build pass.

### 2026-07-10 — Phase 3 social and leaderboards implemented

- Added searchable profiles, friend request/accept/reject/cancel/remove/block actions, friends list sections, and shared social navigation.
- Replaced direct friendship mutations with authenticated, server-owned RPCs that validate the actor and allowed state transition. Added global and accepted-friends leaderboard RPCs with deterministic tie-breakers, current correct-outcome streaks, and profile statistics.
- Added `/friends`, `/leaderboard`, and `/profile` pages with responsive list/table/card layouts. Updated README testing guidance.
- Added migration `supabase/migrations/20260710135921_social_leaderboards.sql`; it is deployed to the linked hosted project.
- Validation: `npm run test` passed with 8 tests; `npm run lint`, `npm run typecheck`, and `npm run build` passed. Build retains the existing Next.js middleware deprecation warning.

## Open items

- Add authenticated integration coverage for prediction submit/edit/lock flows and result processing.
- Add authenticated integration coverage for friendship transitions, leaderboard visibility, and profile-stat accuracy against hosted data.
- Decide whether the demo tournament dates and records in `supabase/seed.sql` should be replaced with the target competition dataset.
- Add Phase 1 onboarding UI for username, display name, and favourite team after Supabase auth is connected.
- Extend Phase 2 and Phase 3 with authenticated integration tests for prediction submission, locking, result processing, friendship transitions, and leaderboard visibility.
- Resolve any future PRD/TDD conflicts explicitly in this file before implementation.

### 2026-07-10 — Hosted schema deployed and verified

- Reproduced the first push failure: the remote `citext` extension is installed in the `extensions` schema, so the migration now uses `extensions.citext` for profile usernames.
- Added explicit Data API grants for the public tables while preserving RLS, reflecting Supabase’s new-table exposure defaults.
- Applied the initial schema migration and demo seed to the linked hosted project. The CLI could not run remote seed through `--include-seed` without Docker, so `supabase db query --linked --file supabase/seed.sql` was used successfully.
- Added follow-up migrations `20260710093602_restrict_auth_trigger_execute.sql` and `20260710093834_revoke_trigger_api_roles.sql` to restrict the security-definer Auth trigger to `supabase_auth_admin`.
- Verification query returned 1 tournament, 4 teams, 4 players, and 2 matches. Remote migration history contains all three local migrations.
- Security advisors no longer report this project’s `handle_new_user()` function. They still report Supabase’s pre-existing `public.rls_auto_enable()` helper; it was not modified because it is provider-managed.

### 2026-07-10 — Leaderboard RPC ambiguity fixed

- Fixed the `column reference "user_id" is ambiguous` error raised by the global/friends leaderboard RPC and, consequently, the profile statistics RPC.
- Qualified all aggregation and streak CTE column references in the Phase 3 leaderboard function so PL/pgSQL return-column variables cannot shadow query fields.
- Updated the original Phase 3 migration for clean installs and added/deployed `supabase/migrations/20260710144546_fix_leaderboard_column_ambiguity.sql` for the linked hosted project.
- Validation: the hosted authenticated smoke test returned one leaderboard result set and one profile-stat result set without error. The Supabase security advisor reports expected authenticated `SECURITY DEFINER` RPC warnings (each validates `auth.uid()` and has explicit grants), the existing provider-managed `rls_auto_enable()` warning, and leaked-password protection disabled in the hosted Auth configuration.

### 2026-07-10 — Link-button contrast cascade fixed

- Fixed dark link buttons inheriting the page foreground color, which made the dashboard “Open matches” action render black text on a dark background.
- Moved the global anchor reset into Tailwind’s `base` layer in `app/globals.css`; utility classes such as `text-white` now correctly override it on every page.
- Validation: rendered button colors are correct in the local browser at 375px and 1440px with no horizontal overflow. `npm run lint`, `npm run typecheck`, and `npm run build` pass; the build retains the existing Next.js middleware deprecation warning.

### 2026-07-11 — Phase 4 Called It cards implemented and deployed

- Added deterministic rarity tiers and tests, idempotent server-side card issuing, notification creation, and card revocation when a corrected official result invalidates eligibility.
- Added `supabase/migrations/20260711101124_called_it_card_lifecycle.sql`: card match/result metadata, partial uniqueness for active cards, active-only public RLS reads, owner reads for private cards, and an authenticated ownership-checked visibility RPC. Direct card writes remain server-owned.
- Added profile card collections, visibility controls, public `/cards/[publicSlug]` pages with share metadata, and native share/copy/download-SVG actions. The visual signature is a verified football match ticket rather than a generic achievement badge.
- Hosted deployment: migration applied successfully. Disposable end-to-end smoke testing verified issue → public read → corrected-result revocation, and cleanup verification found no temporary records. Public card UI was checked at 375px and 1440px with no horizontal overflow.
- Validation: `npm run test` passed with 11 tests; `npm run lint`, `npm run typecheck`, and `npm run build` passed. The security advisor reports the expected authenticated `SECURITY DEFINER` visibility RPC warning (explicit grant plus `auth.uid()` ownership check), existing sanctioned RPC warnings, provider-managed `rls_auto_enable()`, and leaked-password protection disabled. Build retains the existing middleware deprecation warning.

### 2026-07-11 — User-requested hosted Called It demo cards

- Added three clearly labelled hosted demo matches and fully correct predictions for profile `muhammad.ayaan.7177`, then processed them through the normal result-processing flow.
- The profile now has three active demo cards: exact score, confidence call, and the required 0–0/no-goalscorer case. They intentionally contribute to that profile’s statistics and leaderboard totals.
- Validation: hosted query confirms three active cards, all tied to `Demo card · …` matches. To remove this demo data later, delete the hosted matches whose `external_id` begins with `demo-card-`; prediction and card rows cascade-delete.

### 2026-07-11 — Phase 5 AI briefings and polish implemented

- Installed pinned `@google/genai` `2.11.0` and implemented Gemini 3.1 Flash-Lite summaries using server-only credentials, structured JSON Schema output, Zod validation, aggregate-only snapshots, and sanitized failures. AI never affects points, ranks, predictions, or card eligibility.
- Added personal prediction briefings on `/profile` and accepted-friends leaderboard recaps on `/leaderboard?scope=friends`. Both read only verified aggregate statistics, cache by SHA-256 input hash, and enforce a one-minute generation cooldown when data changes.
- Added/deployed `supabase/migrations/20260711105035_ai_summary_cache.sql` with cache metadata, a uniqueness index for unchanged user inputs, and summary lookup indexing. Direct browser writes remain unavailable under existing RLS/grants.
- Added explicit loading, retry, unavailable, and public-card-not-found states plus the server-only `GEMINI_API_KEY` setup documentation. The match-desk panel design keeps AI secondary to deterministic statistics.
- Validation: 13 unit tests, lint, typecheck, and production build pass. Security advisors report only the existing provider-managed/RPC warnings and disabled leaked-password protection. A disposable browser account was cleaned up; its in-app-browser sign-in did not establish a session, so authenticated visual fallback inspection remains unverified.
- Dependency note: the install command reported two moderate `npm audit` findings; they were not changed because they are outside the Phase 5 scope and should be assessed separately.

### 2026-07-11 — Live Gemini key verified

- Confirmed `.env.local` contains `GEMINI_API_KEY` without exposing its value.
- Sent one live structured-output request through `@google/genai` using the application model `gemini-3.1-flash-lite`; the response parsed successfully.
- Validation: live Gemini connectivity and JSON-schema response passed. The authenticated profile UI still requires a signed-in browser session for an end-to-end click test.

### 2026-07-11 — Live data, automated results/cards, and profile plan documented

- Added `called-it-live-data-profile-implementation-plan.md` as an implementation-ready execution contract for the next phase.
- Product/TDD scope addressed: real fixtures, kickoff/status changes, squad/player snapshots, server-side deadlines, official-result confirmation, deterministic scoring, Called It issue/revoke/reissue, result corrections, profile onboarding, and seeded fallback reliability.
- Technical decisions: keep football-data.org behind normalized provider interfaces; retain the Next.js modular monolith; use Supabase Cron only to invoke a protected due-work route; add quota guards, leases, sync audit records, stable result hashes, transactional result application, explicit grants/RLS, and database-enforced notification/card idempotency.
- Current implementation was inspected before planning, including match queries, manual result processing, scoring, card sync, profile UI/actions, Auth callback flow, migrations, and existing provider-facing IDs.
- Official guidance checked: football-data.org v4 competition/match/team resources, goal and lineup unfolding headers, statuses, throttling headers, Supabase Cron/pg_net/Vault/RLS/profile security and the 2026 explicit Data API grant change, plus current Vercel Cron limits.
- Validation: the plan contains 1,106 lines and all required topic checks passed; Markdown code fences are balanced. No runtime code, schema, environment, or hosted data was changed.
- Follow-up: implementation must begin with Phase 0 provider competition/season, match/goal/lineup/squad access, quota, and recorded regular/extra-time/penalty-shootout/0–0/own-goal contract verification. The operator must supply or confirm the intended football-data.org competition code/ID and season rather than allowing an agent to guess.

### 2026-07-11 — Phase 0 provider verification tooling started

- Added the initial provider verification workflow and `npm run sports:verify` command.
- This work was superseded by the provider change recorded below; the verifier now lives at `scripts/verify-football-data.mjs` and uses football-data.org configuration.

### 2026-07-11 — Sports provider changed to football-data.org

- Superseded the original API-Football plan at the user's request.
- Updated `called-it-live-data-profile-implementation-plan.md` and `called-it-technical-design.md` to use football-data.org API v4, competition codes/IDs, `X-Auth-Token`, competition match/team resources, unfolded goals/lineups/substitutes, documented statuses, and the provider's request-budget headers.
- Replaced the Phase 0 verifier with `scripts/verify-football-data.mjs`; `npm run sports:verify` now reads `FOOTBALL_DATA_API_TOKEN`, `FOOTBALL_DATA_COMPETITION`, and `FOOTBALL_DATA_SEASON` and never writes to Supabase.
- Updated `.env.example` and `README.md` with the new environment variable names.
- Important provider capability decision: football-data.org exposes goal records and lineups through match responses, but its documented match score model must be contract-tested for regulation, extra time, and penalty shootouts before automatic scoring is enabled. Goal lists do not expose a separate cancelled-goal event, so conflicting/corrected data must enter manual review.
- Validation: `node --check scripts/verify-football-data.mjs`, `npm run lint`, `npm run typecheck`, and `npm test` passed (13 tests). Live coverage remains blocked until the local token and competition code/ID are configured; the verifier correctly stops before network access when those values are absent.

### 2026-07-12 — Media enrichment layer implemented

- Added reusable `TeamCrest`, `PlayerAvatar`, `ProfileAvatar`, `CountryFlag`, and `MediaFallback` primitives with controlled remote-image validation, meaningful alt text, fixed dimensions, contain/cover behavior, and silent error fallbacks.
- Approved image hosts are `crests.football-data.org` and `flagcdn.com`; the configured Supabase project hostname is added to Next image configuration for existing profile storage URLs. Country flags normalize valid two-letter ISO codes and reject invalid values.
- Added provider media fields to bounded match/team/player queries and Called It card queries. Match Desk, results archive, prediction scorer preview, Called It cards, leaderboard, friends, and profile edit surfaces now use the shared media primitives. Profile avatar uploads and decorative/editorial photography remain deferred.
- Leaderboard and social profile reads hydrate only the profile media and favorite-team crest needed for the returned rows; existing profile visibility/RLS remains authoritative and no provider-owned media fields became client-writable.
- Validation: 20 Vitest files / 69 tests, lint, typecheck, and production build pass. The initial `npm test -- --runInBand` attempt was invalid for Vitest and was rerun correctly as `npm test`.
- Follow-up: authenticated visual QA at 375px, 768px, and 1440px plus slow/broken remote-image checks still require a signed-in browser session. Player provider photo normalization is currently null, so scorer portraits use the designed fallback until the provider supplies photo URLs.

### 2026-07-12 — Account panel and navigation cleanup implemented

- Converted the authenticated app shell to load the current profile from Supabase and display the stored profile avatar with the shared initials fallback in the desktop account panel and mobile header.
- Added View profile, Profile settings, favourite-team context, and server-side Log out actions to the account area. Logout uses the existing Supabase server client and redirects to `/login`.
- Removed the abbreviated `HM`, `MX`, `RK`, `FR`, and `PR` navigation labels while preserving readable navigation labels and icons.
- Validation: tests (20 files / 69 tests), lint, typecheck, and production build all pass.

### 2026-07-12 — Auth-aware landing, local timestamps, and searchable country profiles

- Product/TDD requirements addressed: display provider freshness in the viewer's local timezone, keep authenticated navigation oriented toward the dashboard, reduce onboarding/profile country-selection friction, and show profile country flags.
- Added a browser-local `LocalTime` primitive with an explicit timezone abbreviation and UTC server snapshot to avoid hydration mismatches. Match freshness and refresh-check timestamps now use it.
- The public landing page now checks the Supabase session server-side: signed-in users see Dashboard/Open your dashboard actions and signed-out users see Sign in/Get started.
- Replaced the profile country-code text field with a searchable native datalist picker backed by ISO country names/codes, a clear action, hidden normalized country code, and live flag preview. Added the picker to onboarding and profile editing, and added the saved flag chip to the profile view.
- Validation: 21 Vitest files / 70 tests, `npm run lint`, `npm run typecheck`, and `npm run build` pass. Build retains the existing Next.js middleware deprecation warning. Authenticated visual browser QA remains unverified in this environment.
- No database schema or RLS changes. Country values remain server-validated and profile updates continue through the existing Supabase-authenticated action.

### 2026-07-12 — Favourite-team picker and match-time correction

- Supersedes the searchable-country-picker decision above: the intended friction was the large favourite-team crest grid, not country selection. Removed the country search module and restored the compact two-letter country-code field in profile details.
- Added a compact searchable favourite-team picker for onboarding and profile editing. It initially shows only the selected crest; searching by team or country returns up to eight crest-and-flag choices, avoiding a long scroll through every team.
- Added the selected favourite team’s crest and country flag to the profile view. Country flags remain visible where a user has supplied a country code.
- Extended `LocalTime` to scheduled match cards so kickoff times now use the browser’s local timezone and include its abbreviation. The existing client-side prediction lock time already uses the browser clock for presentation while server/database enforcement remains unchanged.
- Validation: 20 Vitest files / 69 tests, `npm run lint`, `npm run typecheck`, and `npm run build` pass. No schema, RLS, or hosted data changes.

### 2026-07-12 — Final polish: active navigation, app identity, and first-run dashboard

- Added route-aware active states to desktop and mobile navigation with `aria-current` and lime match-night emphasis.
- Added original Called It ticket SVG icons for browser/app identity and richer root metadata for page titles, descriptions, Open Graph, and Twitter cards.
- Made the dashboard first-run state data-aware using the authenticated user's prediction count: new users get a focused first-call prompt, while returning users get continuation copy.
- Validation: 20 Vitest files / 69 tests, `npm run lint`, `npm run typecheck`, and `npm run build` pass. Build retains the existing Next.js middleware deprecation warning. No schema, RLS, or hosted data changes.
