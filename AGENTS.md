# Called It Repository Guidance

## Required context before coding

Before planning or implementing any feature, bug fix, migration, refactor, or other code change:

1. Read `MEMORY.md` to understand the current implementation state, decisions, known gaps, and prior work.
2. Read the applicable requirements in `called-it-prd.md` and treat the PRD as the product source of truth.
3. Read the applicable sections of `called-it-technical-design.md`, the technical design document (TDD), and follow it as the implementation source of truth.
4. Inspect the existing code, tests, migrations, and configuration in the affected area before choosing an implementation.
5. Resolve conflicts in this order: direct user request, this file, the PRD, the TDD, then existing implementation details. Record any deliberate deviation in `MEMORY.md`.

The repository currently has no `called-it-tdd.md`; `called-it-technical-design.md` is the TDD/implementation reference. If a dedicated TDD is added later, read both documents and record which one governs the affected work.

Do not begin implementation based only on a task title or an isolated code file. For changes that cross product and technical boundaries, read all relevant sections of both source documents.

## Implementation workflow

Use this sequence for every code change:

1. Translate the request into acceptance criteria using the PRD.
2. Identify the relevant architecture, data model, API, security, and testing guidance in the TDD.
3. Check `MEMORY.md` for completed work, open decisions, constraints, and known risks.
4. Write or update a focused test first when behavior is testable; then implement the smallest change that satisfies the criteria.
5. Validate the change with the narrowest relevant tests first, followed by broader checks when practical.
6. Update `MEMORY.md` immediately after implementation with what changed, why, tests run, and any follow-up work.

Do not mark a feature complete in `MEMORY.md` unless its acceptance criteria are implemented and the relevant validation has been run or the limitation is explicitly recorded.

## Product and architecture constraints

- The product is a responsive social football prediction platform. Keep the MVP focused on authentication, profiles, matches, predictions, confidence multipliers, scoring, friends, leaderboards, Called It cards, seeded demo reliability, and one grounded Gemini feature.
- Use the modular-monolith approach described by the TDD: one Next.js App Router application with server actions/route handlers, Supabase Postgres/Auth/Storage, and domain modules under `lib/`.
- Keep provider integrations behind interfaces or service modules. Sports data must support a seeded/demo fallback, and external-provider failure must not make the core demo unusable.
- Keep scoring deterministic application code. AI and external services must never determine points or rankings.
- Enforce prediction deadlines with server time and server-side/database controls. Client-side disabling is only presentation logic.
- Preserve Row Level Security. Predictions must remain hidden from other users before kickoff, and clients must not be able to edit scoring-owned fields or insert Called It cards.
- Make result processing idempotent and protect confidence allowances against concurrent requests.
- Keep public Called It pages limited to public information and avoid exposing private prediction data.
- Do not add excluded MVP features such as private leagues, betting, cryptocurrency, live chat, user-created posts, native mobile apps, or paid prediction advantages without an explicit product decision.
- Do not introduce Snowflake, ElevenLabs, or other future architecture into the weekend MVP unless the user explicitly changes scope; the TDD notes these as non-goals despite the PRD mentioning Snowflake analytics.

## Testing and quality

Prioritize tests for scoring, outcome and goal-difference rules, exact scores, first goalscorers including 0–0 matches, confidence multiplication and limits, Called It eligibility, result corrections, knockout regulation-time behavior, and prediction locking.

For data and integration work, cover uniqueness, RLS visibility and mutation rules, friendship transitions, authentication/profile creation, prediction submission/editing, result processing, leaderboard updates, Called It generation, and mocked Gemini structured output. Add Playwright smoke coverage for the critical user journey when the test harness exists.

For UI work, verify mobile and desktop behavior at approximately 375px, 768px, and 1440px, along with keyboard navigation and touch interactions. Follow the repository's existing formatter, linter, and naming conventions; do not add a new tool without a clear need.

## Change discipline

- Prefer small, focused changes that fix root causes and preserve existing user work.
- Do not make undocumented schema changes through a dashboard; store migrations in source control.
- Never commit secrets. Use the publishable key in browser code and keep the secret key server-only; legacy anon/service-role variable names are supported only for compatibility.
- Do not modify unrelated files or features, and do not commit or create branches unless explicitly requested.
- Avoid adding inline code comments unless they explain a non-obvious invariant that cannot be expressed by the code.

## MEMORY.md maintenance

`MEMORY.md` is the project implementation ledger, not a transcript. Keep it concise and factual. After each implementation, append or update:

- Date and change summary.
- Product/TDD requirement addressed.
- Files or modules changed.
- Tests and validation run, including failures or unverified checks.
- Important decisions, assumptions, migrations, or security implications.
- Remaining follow-up work or newly discovered risks.

When a later change supersedes a decision, update the current-state section and preserve the historical entry with the reason for the change. Never record speculative work as completed.
