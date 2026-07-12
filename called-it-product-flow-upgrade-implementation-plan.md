# Called It Product-Flow Upgrade — Implementation Plan

**Status:** implementation-ready planning document. No application code, schema, hosted data, or runtime behaviour is changed by this file.  
**Purpose:** correct the information hierarchy and logical flow issues identified after the dark UI revamp, beginning with unbounded final-result rendering and extending the same curation principles across Matches, Dashboard, Rankings, Friends, Profile, Cards, navigation, timing, and freshness.

## 1. Product decision

Called It should not render every record merely because the database can return it. Each primary page must prioritize the user’s current decision and move historical or secondary information into an explicit archive, detail view, or progressive disclosure.

The guiding hierarchy is:

1. **Act now** — live matches, missing predictions, incoming friend requests, and actionable errors.
2. **Understand what changed** — recent scored predictions, rank movement, result corrections, and newly earned cards.
3. **Review history** — all results, prediction history, card collection, and older social state.

This preserves the PRD requirement that users can view all completed matches and their history without forcing the entire archive into the default Match Desk or Profile.

## 2. Requirements and guardrails

### 2.1 Product requirements addressed

| Requirement | Planned behaviour |
| --- | --- |
| Predictions should take seconds | Match cards remain compact until the user chooses “Make call” or “Edit call”; only one prediction editor is open at a time. |
| Upcoming, live, and completed matches remain available | The default desk curates actionable fixtures and recent outcomes; a results/archive view exposes the full history. |
| Match filters | Status, prediction state, date/matchday, stage, and team become real URL-backed filters. |
| Final results and point breakdowns | Recent personalized results show on the desk; full results and score breakdowns are available in the archive/detail surface. |
| Deadlines are fair | UI countdowns use a server-derived reference time; the submission RPC/database remains authoritative. |
| Times use the user’s local timezone | Browser-local display is used consistently without moving deadline enforcement into the browser. |
| Confidence limits are clear | Remaining 2×/3× uses show their tournament/round scope and reset context. |
| Friend predictions reveal after kickoff | Existing RLS is used and tested; the reveal is added only after kickoff and never by bypassing RLS. |
| Rankings motivate repeat use | The table appears before optional AI analysis, with the current user’s rank context kept visible. |
| Profiles show record and history | Primary stats are separated from secondary metrics; prediction history and card collection become paginated archive surfaces. |
| Mobile-first navigation | Active route, account actions, safe-area behaviour, and focused prediction editing work at 375px. |
| Reliability and seeded fallback | Curation is deterministic application logic over existing data; stale/provider failure preserves last-known-good fixtures. |

### 2.2 Non-negotiable technical rules

- Server time, the prediction submission RPC, and database checks remain authoritative for kickoff locking.
- Predictions remain private to other users before kickoff. The existing friends-after-kickoff RLS policy remains the security boundary.
- Clients never calculate official points, ranks, confidence allowances, or Called It eligibility.
- A provider `finished` status is not presented as a fully scored result until `result_processing_status = 'processed'` and the prediction’s scored version matches the match result version.
- Result corrections remain visible and trigger recalculated presentation; the UI never caches an obsolete score breakdown indefinitely.
- No service-role/secret key enters a client component.
- No new `SECURITY DEFINER` function is added merely to simplify UI reads. Prefer authenticated RLS-protected server queries; if an RPC is justified, explicitly validate `auth.uid()`, revoke `PUBLIC`, grant only the intended role, and run Supabase advisors.
- No new table is exposed through the Data API without explicit grants and RLS.

## 3. Target information architecture

### 3.1 Match Desk default

The default `/matches` page becomes a decision surface:

```text
Match Desk
├── data health summary
├── filters: To predict | My calls | Live | Recent | All
├── Live now (only when non-empty)
├── To predict (nearest deadlines first)
├── Saved calls (compact, nearest kickoff first)
├── Recent outcomes (maximum 3 compact rows)
└── Fixture changes requiring attention
```

The page must not show the full completed-match archive by default.

### 3.2 Results archive

Use `/matches/results` for the full archive. This keeps the primary Match Desk URL simple and makes result history linkable.

The archive supports:

- Newest results first.
- `My predictions` on by default, with `All results` available.
- Team, stage, date range, and processing-state filters.
- Stable pagination of 20 rows per page.
- Compact result rows with an expandable score breakdown or link to match detail.
- Empty state that distinguishes “no results exist” from “no results match these filters.”

### 3.3 Match detail

Use protected `/matches/[matchId]` as the canonical detail surface for:

- Scheduled fixture information and the focused prediction editor.
- Live locked state.
- Full-time unconfirmed state.
- Processed result, user prediction, deterministic point breakdown, and Called It status.
- Friends’ predictions after kickoff, read through existing RLS.
- Result correction/recalculation messaging.

The inline desktop editor may remain for speed, but it should share the same view model and components as the detail page.

### 3.4 Secondary archives

- `/profile/predictions` — owner’s paginated prediction history.
- `/profile/cards` — owner’s full Called It collection and visibility controls.
- Profile default shows primary record, recent activity, latest two cards, and links to archives.

## 4. Match lifecycle and result presentation

### 4.1 Presentation state machine

Create a pure display-state mapper. It must consume facts; it must not update match state.

| Match/provider state | Processing state | Prediction version state | UI state | Points shown? |
| --- | --- | --- | --- | --- |
| `scheduled` | any | any | `open` or `locked-soon` | No |
| `live` | any | any | `live-locked` | No |
| `finished` | `not_ready` / `candidate` | any | `full-time-unconfirmed` | No |
| `finished` | `processing` | any | `scoring` | No |
| `finished` | `manual_review` | any | `under-review` | No |
| `finished` | `failed` | any | `scoring-delayed` | No |
| `finished` | `processed` | prediction version matches | `scored` | Yes |
| `finished` | `processed` | prediction version stale | `recalculating` | Hide old total or label explicitly stale |
| `postponed` | any | any | `postponed` | No |
| `cancelled` | any | any | `cancelled` | No |

Required copy examples:

- `Full time · awaiting confirmation`
- `Result confirmed · calculating points`
- `Scored · +8 points`
- `Official result under review`
- `Result corrected · recalculating your points`

### 4.2 Recent-outcome curation

Add a pure function in `lib/matches/curation.ts`:

```ts
selectRecentOutcomes({ matches, now, limit: 3 }): MatchDeskResult[]
```

Selection rules, in order:

1. Include the user’s predicted matches finished in the last seven days.
2. Include unpredicted matches only when finished in the last 48 hours.
3. Prioritize newly scored, corrected/recalculating, under-review, and Called It outcomes over ordinary unpredicted results.
4. Sort by `kickoffAt DESC`, then `id DESC` for deterministic ordering.
5. Return at most three rows on the default desk.
6. Report the remaining count for `View N more results`.

All results remain available in the archive, satisfying the PRD without overwhelming the decision surface.

### 4.3 Fixture-change curation

- Show postponed matches when they are future-relevant or the user already predicted them.
- Show cancelled matches for seven days after the status change when a user prediction exists; otherwise for 48 hours.
- Do not keep historical cancellations permanently on the default desk.
- If `updated_at` is not currently selected, add it to the view model; do not add a new table solely for dismissal state in the MVP.

## 5. Query and data contracts

### 5.1 Split summary and detail reads

The current `getMatchesForUser` hydrates teams, players, predictions, and allocations for every returned match. Replace it with narrower contracts:

```ts
type MatchDeskFilters = {
  view: "to-predict" | "my-calls" | "live" | "recent" | "all";
  teamId?: string;
  stage?: string;
  date?: string;
};

type MatchDeskData = {
  live: MatchSummary[];
  toPredict: MatchSummary[];
  savedCalls: MatchSummary[];
  recentOutcomes: ResultSummary[];
  recentOutcomeRemainder: number;
  fixtureUpdates: MatchSummary[];
  freshness: { staleCount: number; delayedCount: number; latestCheckedAt: string | null };
  serverNow: string;
};
```

Functions:

- `getMatchDeskForUser(supabase, userId, filters)` — summary data only.
- `getMatchDetailsForUser(supabase, userId, matchId)` — one match, its two squads/available players, owner prediction, allocations, result versions, and score breakdown.
- `getResultsArchiveForUser(supabase, userId, filters, page)` — result rows only.
- `getFriendPredictionsAfterKickoff(supabase, matchId)` — authenticated client query relying on existing RLS; never use the admin client.

### 5.2 Required fields

Extend match summary/detail selects with the existing columns needed for honest presentation:

- Match: `result_version`, `result_confirmed_at`, `result_processed_at`, `updated_at`, `result_processing_status`, `last_synced_at`, status and scores.
- Owner prediction: `base_points`, `total_points`, `outcome_points`, `goal_difference_points`, `exact_score_points`, `first_goalscorer_points`, `scored_result_version`, exact/correct flags, submitted/updated timestamps.
- Called It: active card identifier/slug where relevant.

No scoring field is writable through these UI reads.

### 5.3 Pagination

- Use a page size of 20.
- For direct Supabase queries, use a stable order and `.range(from, to)` with a count only where the UI needs total pages.
- Preferred stable order: `kickoff_at DESC, id DESC` for results and `issued_at DESC, id DESC` for cards.
- If joined pagination becomes inefficient, add a dedicated authenticated RPC only after measuring the query. Do not pre-emptively introduce a broad privileged function.

### 5.4 Leaderboard pagination

The current RPC accepts only `p_limit` and the app requests 100 rows. Add a new migration only when implementing pagination:

```text
get_leaderboard_page(p_scope text, p_limit integer, p_offset integer)
```

Requirements:

- Validate `p_scope IN ('global', 'friends')`.
- Clamp limit to 1–100 and offset to a non-negative value.
- Preserve existing deterministic tie-breakers.
- Preserve profile visibility and accepted-friend filtering.
- Revoke execution from `PUBLIC`, `anon`, and `service_role`; grant to `authenticated` only.
- Include the current user’s row separately if it falls outside the requested page, or provide a companion `get_current_leaderboard_position` result.
- Create the migration using `npx supabase migration new leaderboard_pagination`; never invent the migration filename.

### 5.5 Index review

Before adding indexes, run `EXPLAIN (ANALYZE, BUFFERS)` against representative hosted or local data. Candidate indexes, only if justified:

- `predictions (user_id, updated_at DESC)` for owner history.
- `called_it_cards (user_id, issued_at DESC) WHERE revoked_at IS NULL` for collection pagination.
- Confirm existing match status/kickoff indexes support result archive filtering before adding another.

Any index or RPC change must be source-controlled, pushed through the normal migration workflow, and checked with Supabase security/performance advisors.

## 6. Detailed flow upgrades

### 6.1 Compact prediction flow

- Default scheduled card shows fixture, local kickoff, deadline state, and `Not predicted` or saved call summary.
- `Make call` / `Edit call` opens one editor. On mobile use a focus-managed full-height sheet; on desktop allow an inline panel or detail route.
- Preserve large score controls, numeric keyboard entry, searchable scorer selection, no-goalscorer option, confidence choices, and sticky save action.
- Do not fetch all player lists for all matches on initial desk load. Fetch the selected match’s detail only.
- After save, collapse to the saved summary and announce success through `aria-live`.
- If the server rejects a late save, refresh the match and replace the editor with the authoritative locked state.

### 6.2 Prediction choice clarity

- Rename `Skip for now` to `Skip scorer — score points still available`.
- Explain `No goalscorer` as a positive prediction, not an omitted field.
- Show `Complete call` when score + scorer/no-goalscorer are supplied; show `Score-only call` otherwise.
- Explain that only a complete exact call can earn a Called It card.
- Show confidence allocation context: `2× · 2 left this round`; do not display a bare unexplained number.

### 6.3 Real filters

Define a Zod search-parameter parser. Unknown values fall back safely rather than reaching query builders.

Supported parameters:

```text
/matches?view=to-predict&team=<uuid>&stage=<slug>&date=YYYY-MM-DD
/matches/results?mine=true&page=2&team=<uuid>&state=scored
```

- Filters must survive refresh and browser back/forward.
- Mobile uses a filter sheet; desktop uses a compact toolbar.
- The page heading and empty-state copy reflect the active filter.
- Never label an anchor link as a filter.

### 6.4 Dashboard snapshot

Replace placeholder dashes and generic “Make the first call” content with real server data:

```ts
type DashboardSnapshot = {
  nextAction: { kind: "predict" | "edit" | "live" | "review-result" | "none"; match?: MatchSummary };
  missingPredictionCount: number;
  remainingMultipliers: { twoX: number; threeX: number; scopeLabel: string };
  stats: ProfileStats;
  latestOutcome: ResultSummary | null;
  latestCard: CalledItCardSummary | null;
  friendContext: { friendCount: number; friendsRank: number | null };
};
```

- Build from parallel authenticated server queries and existing profile-stat RPCs.
- No fake zeroes or dashes when the real data is available.
- Distinguish a true zero from unavailable data.
- Primary CTA adapts to the next action.
- Do not add an activity feed until notification/privacy requirements are implemented.

### 6.5 Local time and authoritative locking

- Add a `LocalDateTime` client component for human-readable browser-local display.
- Server-render an ISO timestamp and accessible UTC fallback so the page remains meaningful before hydration.
- Add a `ServerCountdown` that receives `serverNow` and `kickoffAt`, computes a client offset, and refreshes/revalidates at zero.
- The client countdown disables presentation controls, but the server action/RPC still decides whether a save is accepted.
- Use consistent local-time formatting on Match Desk, result archive, match detail, cards, and dashboard.

### 6.6 Freshness and adaptive refresh

Replace the single newest-sync timestamp with a page health summary derived from every displayed fixture:

- `All displayed fixtures current`
- `3 fixtures need an update`
- `Live data delayed`

Refresh policy as a pure function:

| Page state | Interval |
| --- | --- |
| Live match or result processing pending | 60 seconds |
| Kickoff within 30 minutes | 2 minutes |
| Scheduled fixtures farther away | 5 minutes |
| Results archive/profile/friends | No automatic refresh |

Manual refresh remains available. Visibility handling should pause unnecessary refresh while the tab is hidden and refresh once when it becomes visible again.

### 6.7 Navigation, account, and onboarding

- Move route-aware navigation into a small client component using `usePathname`; apply `aria-current="page"`, active rail/bottom-nav styling, and visible text.
- Replace ambiguous glyphs with a consistent accessible icon set or checked-in SVG components.
- Add an account menu with `Edit profile` and `Sign out`.
- Sign out through Supabase Auth, then redirect to `/login`; do not only clear local UI state.
- Move `/onboarding` into a route group with a minimal onboarding layout so incomplete users do not see navigation they cannot successfully use.
- Preserve middleware completion enforcement and safe same-origin `next` destinations.
- Replace nested interactive structures such as a `Link` inside a `button` with link-styled components or a polymorphic `ButtonLink`.

### 6.8 Leaderboard hierarchy

- Order: scope/filter controls → current-user context → table → optional AI briefing.
- Keep Global/Friends scope in the URL.
- Add pagination after 50 rows; do not render 100 indefinitely on mobile.
- Keep the current user visible through a pinned summary if their table row is outside the page.
- AI remains secondary and must not push the standings below the fold.
- Empty Friends view links directly to friend search.

### 6.9 Friend management

- Show incoming requests first only when non-empty.
- Hide empty groups unless all groups are empty; use one actionable all-empty state.
- Keep `Accept` primary and `Reject` secondary.
- Move `Block` into an overflow/secondary action.
- Confirm `Remove friend` and `Block` with a focus-managed dialog explaining the consequence.
- After an action, revalidate and announce the new relationship state without leaving stale controls visible.
- Preserve searchability/profile-visibility filtering and existing server-owned friendship transitions.

### 6.10 Profile, history, cards, and AI

- Primary record: points, global rank, friends rank, streak.
- Secondary metrics: accuracy, exact scores, first scorers, average points, prediction count.
- Show latest two active Called It cards; link to `/profile/cards` for the paginated collection.
- Add `/profile/predictions` with newest-first history and processing/point-breakdown states.
- Keep AI after verified record/recent activity. AI must not be the first explanation of performance.
- Paginate cards and prediction history; do not hydrate every card on the default profile.
- Preserve owner-only card visibility controls and public-card RLS.

### 6.11 Friend prediction reveal

The database already has an RLS policy allowing accepted friends to read predictions only after kickoff. Implement the UI using the authenticated Supabase client and test the policy rather than adding an admin read.

- Before kickoff: no friend prediction query result is rendered.
- At/after kickoff: match detail may show accepted friends’ calls.
- Blocked, rejected, pending, removed, and non-friend users must not appear.
- Profile visibility does not weaken the prediction timing rule.
- Result correction changes result/points presentation, not the original locked prediction.

## 7. Implementation phases

### Phase 0 — Contracts, baselines, and tests first

**Deliverables**

- Capture current screenshots at 375px, 768px, and 1440px.
- Add pure unit-test fixtures for match curation, result presentation, filters, and refresh intervals.
- Record baseline query counts and representative result/profile payload sizes.
- Confirm current RLS behaviour for owner and friend predictions before altering UI queries.

**Tests to add**

- `lib/matches/curation.test.ts`
- `lib/matches/result-presentation.test.ts`
- `lib/matches/filter-schema.test.ts`
- `lib/matches/refresh-policy.test.ts`

**Exit criteria:** expected curation and state rules fail for the right reasons before implementation.

### Phase 1 — Query split and result state model

**Deliverables**

- Introduce summary/detail/archive view models.
- Split `getMatchesForUser` into desk, detail, and archive queries.
- Select processing/version/point fields required for honest result states.
- Implement pure result-state mapper and recent-outcome curation.

**Exit criteria:** default desk data is bounded; result states are deterministic and covered by unit tests; no privacy or scoring logic is duplicated.

### Phase 2 — Curated Match Desk and results archive

**Deliverables**

- Replace the unbounded results section with maximum-three recent outcomes.
- Add `/matches/results`, pagination, filters, compact rows, and empty states.
- Add curated fixture updates and newest-first result ordering.
- Make processing/correction states prominent and hide unconfirmed points.

**Exit criteria:** an old completed tournament no longer floods `/matches`, but every result remains reachable through the archive.

### Phase 3 — Focused prediction and match detail flow

**Deliverables**

- Compact scheduled cards and one-at-a-time editor.
- Protected match-detail route.
- Lazy detail/player reads.
- Clarified scorer/completeness/confidence copy.
- Server-relative countdown and authoritative late-save recovery.

**Exit criteria:** a user can find an unmade call and save it quickly at 375px; only one detailed editor is open; server rejection always wins.

### Phase 4 — Dashboard and local-time correctness

**Deliverables**

- Real dashboard snapshot and adaptive CTA.
- Local date/time component across all relevant surfaces.
- Missing-call and multiplier context.
- Recent outcome/card summary.

**Exit criteria:** no placeholder rank/point values remain when authenticated data exists; all displayed times use the user’s local timezone.

### Phase 5 — Freshness and refresh policy

**Deliverables**

- Multi-fixture health summary.
- Adaptive refresh interval and tab-visibility handling.
- Manual refresh retained.
- Stale/live-delay states verified without deleting last-known-good data.

**Exit criteria:** quiet pages stop refreshing every minute; live/pending views remain current and transparent about delay.

### Phase 6 — Shell, navigation, account, and onboarding

**Deliverables**

- Active-route navigation and `aria-current`.
- Account menu and real Supabase sign-out.
- Minimal onboarding layout.
- Valid link/button semantics and consistent icons.

**Exit criteria:** users always know where they are, can sign out, and cannot wander into unusable navigation during onboarding.

### Phase 7 — Rankings and friends

**Deliverables**

- Table-first ranking hierarchy, current-user context, pagination, and AI moved below standings.
- Conditional friend sections and one all-empty state.
- Confirmation dialogs for remove/block and immediate relationship-state feedback.
- Optional leaderboard pagination migration/RPC only if direct existing contract cannot meet the requirement.

**Exit criteria:** rankings remain the primary content; social actions communicate consequence and never expose hidden profiles/predictions.

### Phase 8 — Profile, history, cards, and friend reveal

**Deliverables**

- Primary/secondary stat hierarchy.
- Paginated prediction-history and card-collection routes.
- Latest-two card preview on Profile.
- Post-kickoff friend prediction section on match detail using existing RLS.

**Exit criteria:** profile no longer grows without bound; owners can reach complete history; friend calls remain invisible before kickoff.

### Phase 9 — Integration, accessibility, performance, and rollout

**Deliverables**

- Integration coverage for new server queries and pagination.
- Authenticated Playwright journey across desk → prediction → result → ranking → profile.
- Responsive, keyboard, screen-reader, reduced-motion, and 200% zoom pass.
- Query-plan review and Supabase advisors for any migration/RPC/index work.
- Rollout flag or reversible commit boundary for the Match Desk curation change.

**Exit criteria:** full test/build suite passes; authenticated smoke passes at 375px, 768px, and 1440px; rollback restores the previous desk without data changes.

## 8. Test matrix

### Unit tests

- Recent results are capped at three.
- Predicted/recalculated/Called It outcomes outrank ordinary unpredicted results.
- Result archive sorts newest-first with deterministic tie-breaks.
- Unconfirmed/processing/review/failed states never display official points.
- A matching result version displays the persisted point breakdown.
- Unknown filter parameters safely fall back.
- Refresh intervals match live, near-kickoff, quiet, and hidden-tab states.
- Countdown uses server offset and reaches locked presentation at kickoff.

### Database and integration tests

- Owner can read their prediction and scoring fields.
- Accepted friend cannot read before kickoff and can read after kickoff.
- Pending/rejected/blocked/removed users cannot read the prediction.
- Pagination does not duplicate or omit rows under stable data.
- Any new RPC rejects anonymous users, invalid scope, excessive limit, and negative offset.
- Card collection excludes revoked cards and respects owner/public visibility.
- Result correction exposes the new result version and stale prediction-scoring state until reprocessed.

### End-to-end tests

1. Sign in and land on a real dashboard next action.
2. Open Match Desk and see no unbounded historical result list.
3. Filter to unpredicted matches and open one editor.
4. Save/edit a prediction and see the compact saved state.
5. Simulate/observe kickoff and confirm locked presentation.
6. Open a full-time pending result and see no official points.
7. Process the result and see point breakdown/Called It state.
8. Open the archive and paginate/filter results.
9. Switch leaderboard scope and see the table before AI.
10. Accept/remove/block a friend with correct confirmation and feedback.
11. Verify friend prediction visibility before and after kickoff.
12. Open profile history and card collection without unbounded default rendering.

## 9. Rollout and observability

- Ship query/view-model changes behind the existing routes without changing database facts.
- Log server query failures with route and operation names, never private prediction payloads.
- Track: Match Desk load duration, query count, result archive pagination errors, prediction editor opens/saves, late-save rejections, and stale-fixture count.
- Watch product metrics: percentage of upcoming matches predicted, time from desk open to save, archive usage, dashboard CTA usage, and friends-scope leaderboard usage.
- If the new archive route fails, keep a bounded recent-results section available; do not fall back to rendering every finished match.

## 10. Migration and security checklist

Only Phases 7–8 may require schema/RPC/index migrations, and only after query measurement.

For each migration:

1. Check current Supabase changelog/docs relevant to the feature.
2. Run the pinned CLI `--help` before using a command.
3. Create the file with `npx supabase migration new <descriptive_name>`.
4. Add explicit grants and preserve RLS.
5. Revoke default `PUBLIC` function execution where applicable.
6. Avoid `SECURITY DEFINER` unless there is a documented, reviewed need.
7. Run local/hosted verification queries and Supabase security/performance advisors.
8. Record deployed/unverified state in `MEMORY.md`.

## 11. Definition of done

The product-flow upgrade is complete when:

1. `/matches` prioritizes live and upcoming user actions and shows no more than three recent outcomes.
2. Every completed result remains accessible through a filtered, paginated archive.
3. Result-processing and correction states are honest about whether points are final.
4. Prediction forms use progressive disclosure and fetch detail only when needed.
5. Dashboard values and CTA come from real authenticated data.
6. Match times display locally while server time remains authoritative.
7. Refresh frequency responds to actual match lifecycle.
8. Navigation has active state, sign-out, valid semantics, and an onboarding-safe layout.
9. Rankings, friends, profile history, and card collection no longer render secondary/unbounded content ahead of the user’s primary task.
10. Friend predictions remain protected before kickoff and appear after kickoff only through existing RLS-authorized reads.
11. Unit, integration, database, E2E, responsive, accessibility, lint, typecheck, test, and production-build checks pass or any limitation is explicitly documented.

