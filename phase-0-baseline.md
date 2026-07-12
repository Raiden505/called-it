# Phase 0 baseline

Captured 2026-07-12 before the product-flow upgrade implementation.

## Responsive screenshots

- [375px baseline](<.phase-0-baseline-375.png>)
- [768px baseline](<.phase-0-baseline-768.png>)
- [1440px baseline](<.phase-0-baseline-1440.png>)

These screenshots capture the unauthenticated landing surface because no authenticated browser session was available. Authenticated Match Desk, profile, ranking, and friend screenshots remain a Phase 0 follow-up once a test user session is available.

## Current query baseline

Counts below are source-level Supabase data operations per server-rendered request, excluding the auth session lookup. They describe the current implementation before query splitting.

| Surface | Data operations | Current behavior to preserve or improve |
| --- | ---: | --- |
| `/matches` | 5 | One unbounded match query plus parallel teams, all players for participating teams, own predictions, and confidence allocations. Player detail is fetched for every match even when no editor is open. |
| `/profile` | 10 | Profile, stats RPC, latest AI summary, and an unbounded Called It card collection. Card hydration adds prediction, match, teams, tournament, scorer, and profile reads. |
| `/leaderboard` | 2 | Leaderboard RPC requests up to 100 rows and latest AI summary in parallel. |

Representative selected-column payload shapes:

- Match Desk match rows select 13 match fields, 5 team fields, 4 player fields, 7 prediction fields, and 4 allocation fields.
- Profile cards hydrate 10 card fields across the base card row plus related prediction, match, team, tournament, player, and profile records.
- The current Match Desk view model repeats the full participating-team player set on every match, which is a known payload-growth risk for Phase 1.

Byte-level payload measurement is intentionally not claimed yet: it requires an authenticated request trace or seeded local database session. Phase 1 should add named query instrumentation and capture JSON byte sizes after the query split.

## RLS baseline

The source-controlled policy in `supabase/migrations/20260710000000_initial_schema.sql` currently establishes:

- Owners can read their own predictions.
- Accepted friends can read a prediction only when the related match kickoff is at or before database `now()`.
- Pending, rejected, blocked, removed, and non-friend users do not satisfy the friend policy.
- Prediction insert/update policies require the authenticated user to own the prediction and the match to remain scheduled and in the future.
- A trigger rejects authenticated client changes to server-owned scoring fields.

Hosted policy verification completed on 2026-07-12 with a read-only `pg_policies` query against the linked project. The project returned all four expected policies, and the live expressions confirmed:

- `SELECT` owner access is restricted to `user_id = auth.uid()`.
- Friend `SELECT` access requires `friendships.status = 'accepted'`, matching participant IDs, and `matches.kickoff_at <= now()`.
- `INSERT` requires ownership plus a future kickoff and `scheduled` match status.
- `UPDATE` requires ownership plus a future kickoff and `scheduled` match status, with `WITH CHECK` preserving ownership.

The two-user behavioral test (actual prediction rows before and after kickoff) is still unverified because no authenticated test sessions are available. No RLS policy or migration was changed in Phase 0.

## Phase 0 interpretation

The baseline supports the plan's query split: default Match Desk reads should be bounded and avoid player hydration, while match detail should own the expensive player and friend-prediction reads. The privacy rule remains a database invariant and must be re-tested after those reads are introduced.
