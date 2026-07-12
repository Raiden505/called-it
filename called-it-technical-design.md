# Called It — Technical Design Document

**Status:** Draft for weekend hackathon MVP  
**Platform:** Responsive web application  
**Primary deployment:** Vercel  
**Last updated:** July 10, 2026

---

## 1. Purpose

This document defines the technical design for **Called It**, a responsive football prediction platform where users:

- Create an account using email/password or Google.
- Predict match scores and first goalscorers before kickoff.
- Apply limited confidence multipliers.
- Earn points based on prediction accuracy.
- Add other users as friends.
- Filter leaderboards to compare against friends.
- Receive a **Called It card** when an entire prediction is exactly correct.
- View AI-generated performance and leaderboard summaries.

This design is intentionally scoped for a polished weekend hackathon build. It prioritizes:

1. Fast implementation.
2. Reliable prediction locking and scoring.
3. A polished desktop and mobile experience.
4. Clear separation between essential MVP functionality and future scaling work.

---

## 2. Goals

### 2.1 MVP Goals

- Deliver a working responsive website deployable to Vercel.
- Support email/password and Google authentication.
- Allow predictions to be created and edited before kickoff.
- Lock predictions securely at kickoff.
- Process match results and award points.
- Generate Called It cards only for fully correct predictions.
- Support global and friends-filtered leaderboards.
- Generate grounded AI summaries from verified application data.
- Provide a convincing demo using real or seeded tournament data.

### 2.2 Non-Goals

The MVP will not include:

- Real-money betting.
- Cryptocurrency or blockchain.
- Private leagues.
- Native mobile applications.
- Live chat or user-created posts.
- Fully real-time event streaming.
- Snowflake.
- ElevenLabs.
- Complex moderation workflows.
- A full production-grade sports ingestion pipeline.
- Support for many competitions at launch.

---

## 3. Technical Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js with App Router | Full-stack React framework with strong Vercel integration |
| Language | TypeScript | Type safety across UI, server routes, validation, and database models |
| Styling | Tailwind CSS | Fast responsive development |
| UI components | shadcn/ui or lightweight custom components | Polished interface without building every primitive |
| Backend | Next.js Route Handlers and Server Actions | Avoids a separate backend deployment |
| Database | Supabase Postgres | Relational data, SQL, authentication integration, and fast setup |
| Authentication | Supabase Auth | Email/password and Google OAuth |
| File storage | Supabase Storage | Profile images if included in MVP |
| Validation | Zod | Shared runtime schemas for API and AI outputs |
| Sports data | football-data.org API v4 | Fixtures, goals, lineups, squads, statuses, and scorer data |
| AI | Google Gemini API using `@google/genai` | Structured, grounded performance and leaderboard summaries |
| Hosting | Vercel | Quick Next.js deployment and preview deployments |
| Monitoring | Vercel Runtime Logs plus structured application logs | Sufficient for hackathon MVP |
| Testing | Vitest and Playwright | Unit tests for scoring and smoke tests for critical flows |

---

## 4. Architecture Overview

```text
┌──────────────────────────────────────────────────────┐
│                 Browser / Mobile Browser             │
│                                                      │
│  Next.js UI, forms, optimistic states, responsive UI │
└───────────────────────────┬──────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────┐
│                   Next.js on Vercel                  │
│                                                      │
│  Server Components                                   │
│  Server Actions                                      │
│  Route Handlers                                      │
│  Authentication middleware                          │
│  Prediction validation                              │
│  Scoring service                                    │
│  Gemini summary service                             │
│  Sports API sync service                            │
└──────────────┬──────────────────────┬────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│ Supabase                │   │ External Services       │
│                         │   │                         │
│ Postgres                │   │ football-data.org API   │
│ Auth                    │   │ Google Gemini API       │
│ Row Level Security      │   │                         │
│ Storage                 │   │                         │
└─────────────────────────┘   └─────────────────────────┘
```

### 4.1 Architectural Style

The application uses a **modular monolith**:

- One Next.js application.
- One primary Postgres database.
- Server-side business logic organized into modules.
- External APIs wrapped behind service interfaces.
- No microservices for the MVP.

This is the correct tradeoff for a weekend build. Splitting the system into separate services would create deployment, authentication, networking, and debugging overhead without meaningful benefit.

---

## 5. Recommended Project Structure

```text
called-it/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── matches/
│   │   ├── leaderboard/
│   │   ├── friends/
│   │   ├── profile/
│   │   └── cards/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── sync-fixtures/
│   │   │   └── process-results/
│   │   ├── ai/
│   │   │   ├── performance-summary/
│   │   │   └── leaderboard-summary/
│   │   ├── cards/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── cards/
│   ├── friends/
│   ├── leaderboard/
│   ├── matches/
│   ├── navigation/
│   └── ui/
├── lib/
│   ├── ai/
│   │   ├── client.ts
│   │   ├── prompts.ts
│   │   └── schemas.ts
│   ├── auth/
│   ├── database/
│   │   ├── queries/
│   │   └── types.ts
│   ├── scoring/
│   │   ├── calculate-score.ts
│   │   └── calculate-score.test.ts
│   ├── sports/
│   │   ├── football-data-client.ts
│   │   ├── normalize.ts
│   │   └── types.ts
│   ├── supabase/
│   │   ├── browser.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── validation/
│   └── utils/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   └── e2e/
├── middleware.ts
├── next.config.ts
├── vercel.json
└── package.json
```

---

## 6. Core Domain Model

### 6.1 Main Entities

- User profile
- Friendship
- Tournament
- Team
- Player
- Match
- Prediction
- Confidence allowance
- Scoring result
- Called It card
- Notification
- AI summary

### 6.2 Entity Relationships

```text
auth.users
   │ 1
   │
   │ 1
profiles
   │
   ├──< friendships >── profiles
   │
   ├──< predictions >── matches
   │                       │
   │                       ├── teams
   │                       ├── players
   │                       └── tournaments
   │
   ├──< called_it_cards >── predictions
   │
   └──< notifications

matches
   └──< match_events
```

---

## 7. Database Design

Use UUID primary keys for application-owned entities. External sports-provider identifiers should be stored separately and must not be used as internal primary keys.

### 7.1 `profiles`

Extends `auth.users`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key; same value as Supabase auth user ID |
| `username` | CITEXT | Unique, case-insensitive |
| `display_name` | TEXT | Required |
| `avatar_url` | TEXT | Optional |
| `favorite_team_id` | UUID | Nullable foreign key |
| `country_code` | TEXT | Optional ISO country code |
| `bio` | TEXT | Optional, length-limited |
| `is_searchable` | BOOLEAN | Default true |
| `profile_visibility` | TEXT | `public`, `friends`, or `private` |
| `created_at` | TIMESTAMPTZ | Default now |
| `updated_at` | TIMESTAMPTZ | Default now |

Indexes:

- Unique index on `lower(username)`.
- Index on `favorite_team_id`.
- Trigram index may be added later for fuzzy user search.

### 7.2 `friendships`

Store one canonical row per user pair.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `requester_id` | UUID | User who sent request |
| `addressee_id` | UUID | User receiving request |
| `status` | TEXT | `pending`, `accepted`, `rejected`, `blocked` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

Constraints:

- `requester_id <> addressee_id`
- Unique pair constraint using normalized user ordering or an expression index.
- Only requester may cancel a pending request.
- Only addressee may accept or reject a pending request.
- Either participant may remove an accepted friendship.
- Blocking overrides friendship visibility.

### 7.3 `tournaments`

| Column | Type |
|---|---|
| `id` | UUID |
| `external_id` | TEXT |
| `name` | TEXT |
| `season` | TEXT |
| `starts_at` | TIMESTAMPTZ |
| `ends_at` | TIMESTAMPTZ |
| `status` | TEXT |
| `is_active` | BOOLEAN |

### 7.4 `teams`

| Column | Type |
|---|---|
| `id` | UUID |
| `external_id` | TEXT |
| `name` | TEXT |
| `short_name` | TEXT |
| `code` | TEXT |
| `badge_url` | TEXT |
| `country_code` | TEXT |

### 7.5 `players`

| Column | Type |
|---|---|
| `id` | UUID |
| `external_id` | TEXT |
| `team_id` | UUID |
| `name` | TEXT |
| `position` | TEXT |
| `photo_url` | TEXT |
| `is_active` | BOOLEAN |

### 7.6 `matches`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Internal ID |
| `external_id` | TEXT | Sports API fixture ID |
| `tournament_id` | UUID | |
| `home_team_id` | UUID | |
| `away_team_id` | UUID | |
| `stage` | TEXT | |
| `kickoff_at` | TIMESTAMPTZ | Stored in UTC |
| `status` | TEXT | `scheduled`, `live`, `finished`, `postponed`, `cancelled` |
| `home_score_90` | INTEGER | Score after regulation |
| `away_score_90` | INTEGER | Score after regulation |
| `home_score_final` | INTEGER | Includes extra time if relevant |
| `away_score_final` | INTEGER | Includes extra time if relevant |
| `first_goalscorer_id` | UUID | Nullable |
| `first_goal_was_own_goal` | BOOLEAN | |
| `advanced_team_id` | UUID | Nullable |
| `result_version` | INTEGER | Incremented when corrected |
| `result_confirmed_at` | TIMESTAMPTZ | |
| `last_synced_at` | TIMESTAMPTZ | |

Indexes:

- `kickoff_at`
- `status`
- `(tournament_id, kickoff_at)`
- Unique index on `external_id`

### 7.7 `predictions`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | |
| `user_id` | UUID | |
| `match_id` | UUID | |
| `predicted_home_score` | SMALLINT | |
| `predicted_away_score` | SMALLINT | |
| `predicted_first_goalscorer_id` | UUID | Nullable |
| `predicted_no_goalscorer` | BOOLEAN | Default false |
| `predicted_advanced_team_id` | UUID | Knockout matches only |
| `confidence_multiplier` | SMALLINT | `1`, `2`, or `3` |
| `submitted_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `locked_at` | TIMESTAMPTZ | Nullable |
| `scored_at` | TIMESTAMPTZ | Nullable |
| `scored_result_version` | INTEGER | Match result version used |
| `outcome_points` | INTEGER | |
| `goal_difference_points` | INTEGER | |
| `exact_score_points` | INTEGER | |
| `first_goalscorer_points` | INTEGER | |
| `advance_points` | INTEGER | |
| `base_points` | INTEGER | |
| `total_points` | INTEGER | |
| `is_exact_score` | BOOLEAN | |
| `is_called_it` | BOOLEAN | |

Constraints:

- Unique `(user_id, match_id)`.
- Scores between 0 and a reasonable maximum, such as 20.
- Confidence multiplier limited to `1`, `2`, or `3`.
- `predicted_no_goalscorer` and `predicted_first_goalscorer_id` cannot both be set.

### 7.8 `confidence_allocations`

Tracks multiplier usage per tournament round.

| Column | Type |
|---|---|
| `id` | UUID |
| `user_id` | UUID |
| `tournament_id` | UUID |
| `round_key` | TEXT |
| `multiplier` | SMALLINT |
| `allowed_count` | INTEGER |
| `used_count` | INTEGER |

The MVP may calculate usage directly from predictions instead of maintaining `used_count`. Direct calculation is safer because it avoids synchronization bugs.

### 7.9 `called_it_cards`

| Column | Type |
|---|---|
| `id` | UUID |
| `user_id` | UUID |
| `prediction_id` | UUID |
| `match_id` | UUID |
| `public_slug` | TEXT |
| `rarity_percentage` | NUMERIC |
| `result_version` | INTEGER |
| `issued_at` | TIMESTAMPTZ |
| `revoked_at` | TIMESTAMPTZ |

Constraints:

- Unique active card per prediction.
- Public slug must be unique and unguessable enough to prevent enumeration.

### 7.10 `notifications`

| Column | Type |
|---|---|
| `id` | UUID |
| `user_id` | UUID |
| `type` | TEXT |
| `payload` | JSONB |
| `read_at` | TIMESTAMPTZ |
| `created_at` | TIMESTAMPTZ |

### 7.11 `ai_summaries`

| Column | Type |
|---|---|
| `id` | UUID |
| `user_id` | UUID |
| `summary_type` | TEXT |
| `scope_key` | TEXT |
| `input_hash` | TEXT |
| `content` | JSONB |
| `model_name` | TEXT |
| `created_at` | TIMESTAMPTZ |
| `expires_at` | TIMESTAMPTZ |

The `input_hash` prevents repeated Gemini calls when the underlying statistics have not changed.

---

## 8. Authentication Design

### 8.1 Supported Methods

- Email and password.
- Google OAuth through Supabase Auth.

### 8.2 Session Handling

Use Supabase's server-side rendering helpers with cookie-based sessions.

Create separate Supabase clients for:

- Browser/client components.
- Server components and route handlers.
- Admin-only server operations using the service role key.

The service role key must never be exposed to the browser.

### 8.3 New User Flow

1. User signs up with email/password or Google.
2. Supabase creates an `auth.users` row.
3. A database trigger or server-side onboarding action creates a `profiles` row.
4. User chooses a unique username and favourite team.
5. User is redirected to the dashboard.

### 8.4 Protected Routes

The following routes require authentication:

- `/dashboard`
- `/matches`
- `/leaderboard`
- `/friends`
- `/profile`
- `/settings`

Middleware may perform lightweight session checks, but authorization must also be enforced in server-side queries and Row Level Security policies.

---

## 9. Authorization and Row Level Security

Enable Row Level Security on every user-facing table.

### 9.1 Profiles

- Public profiles are readable by authenticated users.
- Friends-only profiles are readable by accepted friends.
- Private profiles are readable only by the owner.
- A user may update only their own profile.

### 9.2 Predictions

Before kickoff:

- Owner may read their own prediction.
- Other users may not read it.
- Owner may insert or update it only while `now() < match.kickoff_at`.

After kickoff:

- Owner may always read it.
- Accepted friends may read it.
- Public visibility may be added later.

No client is allowed to modify scoring columns.

### 9.3 Friendships

- Participants may read friendship rows involving themselves.
- Only authenticated users may create requests where they are the requester.
- State transitions must be validated server-side.

### 9.4 Called It Cards

- Active public cards may be read using their public slug.
- Only server-side scoring logic may insert, update, revoke, or delete cards.

### 9.5 Server-Owned Tables

The browser must not directly write:

- Matches
- Teams
- Players
- Scoring fields
- Called It cards
- AI summaries
- System notifications

Use server-only route handlers or database functions with controlled privileges.

---

## 10. Prediction Submission Design

### 10.1 API Contract

A prediction submission contains:

```ts
type PredictionInput = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  firstGoalscorerId?: string;
  noGoalscorer?: boolean;
  advancedTeamId?: string;
  confidenceMultiplier: 1 | 2 | 3;
};
```

### 10.2 Validation

Validate with Zod on the server:

- Match exists.
- Match status allows predictions.
- Current server time is before kickoff.
- Scores are non-negative integers.
- Player belongs to one of the two teams.
- `noGoalscorer` and `firstGoalscorerId` are mutually exclusive.
- Advanced team is one of the competing teams.
- User has not exceeded the multiplier allowance.
- Prediction is associated with the authenticated user.

### 10.3 Atomic Submission

Prediction creation or update and confidence validation should occur in one database transaction or Postgres function.

This prevents a user from:

- Submitting after kickoff due to client clock manipulation.
- Exceeding multiplier limits through parallel requests.
- Editing a locked prediction.
- Assigning a player from another match.

### 10.4 Locking Model

Do not rely on a background job to physically lock every prediction at kickoff.

A prediction is effectively locked when:

```text
current server time >= match.kickoff_at
```

The `locked_at` field is useful for audit and UI purposes, but server authorization must always check the match kickoff timestamp.

This avoids failure if a scheduled lock job does not run.

---

## 11. Scoring Design

### 11.1 MVP Scoring Rules

| Condition | Points |
|---|---:|
| Correct match outcome | 3 |
| Correct goal difference | +2 |
| Exact score | +3 |
| Correct first goalscorer | +4 |

```text
total_points = base_points × confidence_multiplier
```

### 11.2 Outcome Calculation

```ts
function outcome(home: number, away: number): "HOME" | "DRAW" | "AWAY" {
  if (home > away) return "HOME";
  if (home < away) return "AWAY";
  return "DRAW";
}
```

### 11.3 Goal Difference

```text
predicted_difference = predicted_home_score - predicted_away_score
actual_difference = actual_home_score - actual_away_score
```

Goal-difference points are awarded when the differences are exactly equal.

### 11.4 Exact Score

Exact score requires both values to match:

```text
predicted_home_score = actual_home_score
AND
predicted_away_score = actual_away_score
```

### 11.5 First Goalscorer

Award points when:

- The selected player equals the official first goalscorer.
- Or the user selected “No goalscorer” and the match ended without a goal.

Own goals require a product decision:

- For the MVP, an own goal does not count as a correctly selected player.
- A match whose first goal is an own goal should not award first-goalscorer points unless “Own goal” is added as an explicit option later.

### 11.6 Called It Eligibility

A Called It card is issued only when:

```text
exact score is correct
AND
first goalscorer selection is correct
AND
the user submitted a complete first-goalscorer choice
```

A 0–0 Called It requires:

```text
predicted score = 0–0
AND
predicted no goalscorer = true
```

Confidence does not affect eligibility.

### 11.7 Scoring Function

Implement scoring as a pure TypeScript function:

```ts
type ScoreBreakdown = {
  outcomePoints: number;
  goalDifferencePoints: number;
  exactScorePoints: number;
  firstGoalscorerPoints: number;
  advancePoints: number;
  basePoints: number;
  multiplier: 1 | 2 | 3;
  totalPoints: number;
  isExactScore: boolean;
  isCalledIt: boolean;
};
```

The pure function must be heavily unit tested because scoring is the most critical business rule.

### 11.8 Result Processing

When a result is confirmed:

1. Fetch all unscored or stale predictions for the match.
2. Calculate each score.
3. Update scoring columns.
4. Generate or revoke Called It cards.
5. Create notifications.
6. Update the match's processed state.
7. Invalidate relevant cached leaderboard pages.

Use `result_version` so corrected results can be safely reprocessed.

### 11.9 Idempotency

Result processing must be idempotent:

- Running it twice produces the same final state.
- Called It cards are not duplicated.
- Notifications use deterministic deduplication keys.
- Scores are recalculated from source fields rather than incremented.

---

## 12. Leaderboard Design

### 12.1 Global Leaderboard

Aggregate:

```sql
SUM(predictions.total_points)
```

Display:

- Rank
- User
- Favourite team
- Total points
- Exact-score count
- Called It count
- Current streak

### 12.2 Friends Filter

The friends leaderboard includes:

- Current user.
- Users with an accepted friendship to the current user.

Avoid creating a separate league table. This view is a filtered aggregation over the same prediction data.

### 12.3 Ranking Scope

Support:

- Full tournament.
- Tournament round.
- Matchday.
- Global users.
- Friends only.

### 12.4 Performance Strategy

For the hackathon:

- Compute leaderboard aggregates with SQL views or query functions.
- Add indexes on prediction `user_id`, `match_id`, and scoring columns.
- Cache global leaderboard results for a short interval.
- Do not prematurely build a materialized leaderboard service.

A future production phase may use materialized views or precomputed standings.

### 12.5 Tie-Breakers

1. Total points.
2. Called It cards.
3. Exact scores.
4. Correct first goalscorers.
5. Correct outcomes.
6. Shared rank if still tied.

---

## 13. Sports Data Integration

### 13.1 Recommended Provider

Use **football-data.org API v4** for the MVP because it exposes:

- Fixtures.
- Match statuses.
- Goal records.
- Squads and lineups.
- Lineups.
- Competition and team metadata.

The unfolded goal data is important because the product needs a reliable first-goalscorer value.

### 13.2 Provider Abstraction

Do not reference provider response formats throughout the application.

Define an interface:

```ts
interface SportsDataProvider {
  getCompetitionFixtures(competitionId: string): Promise<NormalizedFixture[]>;
  getFixture(fixtureId: string): Promise<NormalizedFixture>;
  getFixtureEvents(fixtureId: string): Promise<NormalizedMatchEvent[]>;
  getTeamPlayers(teamId: string): Promise<NormalizedPlayer[]>;
}
```

Normalize all provider data before storing it.

### 13.3 Sync Strategy

Because this is a weekend MVP and Vercel Hobby cron jobs are not suitable for frequent live polling:

- Seed the full competition schedule before the demo.
- Add a protected admin action to sync fixtures and results.
- Sync an individual match when a user opens a completed match and its data is stale.
- Cache provider responses in Supabase.
- For the demo, manually trigger result processing after a seeded or real match.
- Optionally use one daily Vercel cron for low-frequency fixture refresh.

### 13.4 API Quota Protection

- Never call the sports API directly from the browser.
- Cache all responses.
- Do not fetch the same fixture repeatedly within a short interval.
- Add `last_synced_at`.
- Batch fixture retrieval where the provider supports it.
- Add an admin-only “sync now” action.
- Store raw provider payloads temporarily during development for debugging, then remove or limit them.

### 13.5 Fallback Demo Mode

Create a seed dataset containing:

- 8–16 teams.
- 8–12 fixtures.
- Player rosters.
- Completed match results.
- Upcoming matches.
- At least one Called It example.
- Several users and friendships.

The demo must remain usable even if the external sports API is unavailable.

---

## 14. Google AI Integration

### 14.1 MVP Use Cases

Use Gemini for two features:

1. **Personal performance summary**
2. **Friends leaderboard recap**

The AI must not determine scores, ranks, or Called It eligibility.

### 14.2 Data Flow

```text
Postgres statistics
      │
      ▼
Server-side summary payload
      │
      ▼
Gemini API with structured output schema
      │
      ▼
Zod validation
      │
      ▼
Stored AI summary
      │
      ▼
Rendered in UI
```

### 14.3 Personal Performance Input

Only send aggregated statistics such as:

```json
{
  "displayName": "Ayaan",
  "predictionsMade": 14,
  "correctOutcomes": 9,
  "exactScores": 2,
  "calledItCards": 1,
  "averagePoints": 5.4,
  "confidencePerformance": {
    "1x": 4.8,
    "2x": 6.1,
    "3x": 2.0
  },
  "strongestTeams": ["Spain", "Argentina"],
  "weakestPattern": "underestimated total goals"
}
```

Do not give Gemini unrestricted database access.

### 14.4 Structured Output

Expected schema:

```ts
const PerformanceSummarySchema = z.object({
  headline: z.string().max(80),
  summary: z.string().max(400),
  strengths: z.array(z.string().max(100)).max(3),
  improvementAreas: z.array(z.string().max(100)).max(3),
  factualHighlights: z.array(z.string().max(120)).max(4),
});
```

Reject output that fails validation.

### 14.5 Grounding Rules

Prompts must state:

- Use only supplied data.
- Do not invent statistics.
- Do not provide betting advice.
- Avoid claims about player or team form unless explicitly included.
- Treat comparisons as entertainment rather than expert forecasting.
- Keep the tone playful but not insulting.

### 14.6 Cost and Abuse Controls

- Generate summaries only when requested.
- Cache by `input_hash`.
- Rate-limit summary requests.
- Limit prompt and response size.
- Keep the Gemini API key server-side.
- Allow one summary per user per scope unless data changes.

### 14.7 Failure Handling

If Gemini fails:

- Do not block the rest of the page.
- Show deterministic statistics without AI commentary.
- Log a sanitized error.
- Allow retry after a cooldown.

---

## 15. Called It Shareable Pages

### 15.1 Route

```text
/cards/[publicSlug]
```

### 15.2 Page Content

- User display name and avatar.
- Teams and badges.
- Predicted score.
- Actual score.
- First goalscorer.
- Confidence multiplier.
- Rarity percentage.
- Tournament and match date.
- Verification label.
- Share button.
- Link back to Called It.

### 15.3 Rendering

Use a normal responsive server-rendered page.

Advantages:

- Easy to build.
- Search and social-link friendly.
- No image-generation pipeline required.
- Can later add Open Graph image generation.

### 15.4 Social Metadata

Generate dynamic metadata:

- Title.
- Description.
- Open Graph title and description.
- Public canonical URL.

Future enhancement:

- Use Next.js `ImageResponse` to generate a social preview image.
- Keep the web page as the source of truth.

### 15.5 Privacy

Called It cards are public by possession of the URL unless the user disables public sharing.

Do not expose:

- Email.
- Internal user ID.
- Private friend information.
- Full prediction history.

---

## 16. API and Server Action Design

### 16.1 Preferred Interaction Pattern

Use:

- Server Actions for authenticated form mutations closely tied to pages.
- Route Handlers for external-facing endpoints, admin sync, AI calls, and shareable data.

### 16.2 Core Operations

| Operation | Method |
|---|---|
| Submit or update prediction | Server Action |
| Send friend request | Server Action |
| Accept or reject request | Server Action |
| Remove friend | Server Action |
| Fetch leaderboard | Server Component query |
| Generate AI summary | POST Route Handler |
| Sync fixtures | Protected POST Route Handler |
| Process results | Protected POST Route Handler |
| Fetch public card | Server Component query |

### 16.3 Error Format

Use a consistent typed result:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
```

Do not expose stack traces or provider errors to the user.

---

## 17. Responsive Frontend Design

### 17.1 Navigation

Mobile:

- Bottom navigation.
- Home.
- Matches.
- Leaderboard.
- Friends.
- Profile.

Desktop:

- Top navigation or side navigation.
- Wider content area.
- Multi-column dashboard.

### 17.2 Match Prediction UI

Mobile:

- Large score increment/decrement controls.
- Team badges.
- First-goalscorer searchable sheet.
- Confidence chips.
- Sticky submit button.
- Clear kickoff countdown.

Desktop:

- Side-by-side team layout.
- Expanded player selector.
- Scoring explanation panel.
- Friend prediction reveal after kickoff.

### 17.3 Leaderboard UI

Mobile:

- Card or compact row layout.
- Sticky global/friends toggle.
- Highlight current user.
- Display rank, points, and Called It count prominently.

Desktop:

- Data table.
- Filters above the table.
- Additional statistics columns.
- Current-user row remains highlighted.

### 17.4 Loading and Empty States

Required states:

- No upcoming matches.
- No predictions yet.
- No friends yet.
- No Called It cards.
- Sports data temporarily unavailable.
- AI summary unavailable.
- Leaderboard is recalculating.

Use skeletons for short loads and explicit status messages for longer failures.

---

## 18. Caching and Data Freshness

### 18.1 Cache Categories

| Data | Strategy |
|---|---|
| Static team and tournament data | Long-lived cache |
| Upcoming fixtures | Short cache with admin refresh |
| Completed fixture results | Cache until result version changes |
| Global leaderboard | Short cache |
| Friends leaderboard | User-specific query; limited caching |
| Public Called It pages | Cache and invalidate if card revoked |
| AI summaries | Cache by input hash |

### 18.2 Invalidation Events

Invalidate related data when:

- Prediction is submitted or edited.
- Match result is processed.
- Friendship is accepted or removed.
- Called It card is issued or revoked.
- Profile display information changes.

### 18.3 Time Handling

- Store all timestamps in UTC.
- Compare kickoff times on the server.
- Convert to the browser's local timezone for display.
- Never use the browser clock to enforce deadlines.

---

## 19. Security Design

### 19.1 Secrets

Store in Vercel environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
FOOTBALL_DATA_API_TOKEN
FOOTBALL_DATA_BASE_URL
FOOTBALL_DATA_COMPETITION
FOOTBALL_DATA_SEASON
GEMINI_API_KEY
ADMIN_SYNC_SECRET
```

Only variables prefixed with `NEXT_PUBLIC_` may be exposed to the browser.

### 19.2 Threats and Mitigations

| Threat | Mitigation |
|---|---|
| Editing a prediction after kickoff | Server timestamp check plus RLS |
| Manipulating scores from browser | Scoring fields are server-owned |
| Excess multiplier use | Transactional server validation |
| Reading friends' predictions early | RLS based on kickoff time |
| API key theft | External APIs called server-side only |
| Friend-request spam | Rate limits and pending-request caps |
| Username abuse | Length limits and profanity filtering |
| AI prompt injection | AI receives structured statistics, not user-authored free text |
| Duplicate result processing | Idempotent scoring and result versions |
| Public card enumeration | Random public slugs |
| Unauthorized admin sync | Secret header and server-side authorization |

### 19.3 Rate Limits

Apply rate limits to:

- Login attempts.
- User search.
- Friend requests.
- Prediction mutations.
- AI summary generation.
- Admin sync endpoints.

For the hackathon, a lightweight in-memory limit is insufficient across serverless instances. Prefer database-backed counters or a managed rate-limit service if time allows. At minimum, enforce database constraints and conservative request handling.

---

## 20. Reliability and Error Handling

### 20.1 Sports Provider Failure

- Keep last known data.
- Mark data freshness in admin tools.
- Do not erase match results on a failed response.
- Allow manual retry.
- Demo remains functional using seed data.

### 20.2 Partial Scoring Failure

- Process one match in a transaction where practical.
- Record processing status.
- Retry only stale or failed predictions.
- Recalculate from source data rather than incrementally mutating points.

### 20.3 Result Corrections

1. Increment `matches.result_version`.
2. Reprocess all predictions for the match.
3. Issue or revoke Called It cards.
4. Recalculate rarity.
5. Deduplicate or update notifications.
6. Invalidate leaderboard caches.

### 20.4 Observability

Log structured events:

```json
{
  "event": "match_result_processed",
  "matchId": "uuid",
  "resultVersion": 2,
  "predictionCount": 143,
  "calledItCount": 4,
  "durationMs": 381
}
```

Never log:

- Passwords.
- Access tokens.
- Service role keys.
- Gemini or sports API keys.
- Full private profile data.

---

## 21. Testing Strategy

### 21.1 Unit Tests

Highest priority:

- Outcome calculation.
- Goal-difference scoring.
- Exact-score scoring.
- First-goalscorer scoring.
- 0–0 no-goalscorer logic.
- Confidence multiplication.
- Called It eligibility.
- Result correction.
- Knockout regulation-time behavior.
- Multiplier allowance validation.

### 21.2 Database Tests

Test:

- Prediction uniqueness.
- RLS prevents early prediction disclosure.
- RLS prevents post-kickoff updates.
- Users cannot edit scoring fields.
- Friendship state transitions.
- Called It cards cannot be manually inserted by clients.

### 21.3 Integration Tests

Test:

- Sign up and profile creation.
- Google login callback.
- Submit and edit prediction.
- Lock at kickoff.
- Process result.
- Update leaderboard.
- Generate Called It card.
- Generate Gemini summary using mocked output.

### 21.4 End-to-End Smoke Tests

Using Playwright:

1. Sign in.
2. Open upcoming match.
3. Submit prediction.
4. Edit prediction.
5. View dashboard.
6. Add a friend.
7. Filter leaderboard by friends.
8. Open public Called It page.

### 21.5 Manual Responsive Testing

Test at minimum:

- 375px mobile width.
- 768px tablet width.
- 1440px desktop width.
- Touch interaction.
- Keyboard navigation.
- Dark and light appearance only if both are implemented.

---

## 22. Deployment Design

### 22.1 Environments

- Local development.
- Vercel preview deployment.
- Vercel production deployment.
- Separate Supabase development and production projects if time permits.

For a weekend build, one Supabase project may be acceptable, but preview deployments should not mutate critical production data unexpectedly.

### 22.2 Deployment Flow

```text
Git push
   │
   ▼
Vercel build
   │
   ├── Type checking
   ├── Unit tests
   └── Next.js build
   │
   ▼
Preview deployment
   │
   ▼
Manual smoke test
   │
   ▼
Production promotion
```

### 22.3 Database Migrations

Store SQL migrations in source control.

Do not make undocumented schema changes only through the Supabase dashboard.

### 22.4 Seed Data

Provide:

```bash
npm run db:seed
```

Seed script should create:

- Active tournament.
- Teams.
- Players.
- Upcoming and completed matches.
- Demo users or documented manual test accounts.
- Friendships.
- Predictions.
- At least one Called It card.

---

## 23. Implementation Plan

### Phase 1 — Foundation

- Create Next.js application.
- Configure Tailwind and UI components.
- Create Supabase project.
- Configure server and browser Supabase clients.
- Add email/password authentication.
- Add Google OAuth.
- Create database migrations.
- Add seed data.

### Phase 2 — Core Prediction Loop

- Build match list.
- Build prediction form.
- Implement server-side validation.
- Implement multiplier limits.
- Add prediction locking.
- Add scoring function and tests.
- Add admin result-processing route.

### Phase 3 — Social and Leaderboards

- Add user search.
- Add friend requests and acceptance.
- Build global leaderboard.
- Build friends filter.
- Build profile statistics.

### Phase 4 — Called It

- Add eligibility logic.
- Generate card records.
- Build public card page.
- Add share links and metadata.
- Add rarity calculation.

### Phase 5 — AI and Polish

- Add Gemini client.
- Add structured performance summary.
- Add friends leaderboard recap.
- Add loading, error, and empty states.
- Complete responsive polish.
- Add demo seed scenario.
- Run end-to-end smoke tests.

---

## 24. Weekend Scope Priorities

### Must Have

- Authentication.
- Responsive layout.
- Match list.
- Prediction submission.
- Prediction locking.
- Scoring.
- Leaderboards.
- Friend system.
- Called It card pages.
- One grounded Gemini feature.
- Seeded demo.

### Should Have

- Both Gemini summary types.
- Profile statistics.
- Notifications.
- Real sports API sync.
- Dynamic social metadata.
- Confidence multiplier limits by round.

### Could Have

- Reactions to friends' predictions.
- Live match status.
- Open Graph card image.
- Browser notifications.
- Country leaderboard.
- Advanced personal insights.

### Cut First if Time Runs Out

- Reactions.
- Complex notification center.
- Avatar uploads.
- Country filters.
- Live polling.
- Advanced AI coaching.
- Full admin interface.

Never cut:

- Server-side prediction locking.
- Correct scoring.
- RLS.
- Seeded demo reliability.

---

## 25. Key Technical Decisions

### Decision 1: Modular monolith

**Choice:** One Next.js application.

**Reason:** Fastest route to a polished deployment with fewer moving parts.

### Decision 2: Supabase as operational platform

**Choice:** Supabase Auth plus Postgres.

**Reason:** Authentication, relational data, Row Level Security, and fast setup are all needed.

### Decision 3: football-data.org behind an abstraction

**Choice:** football-data.org API v4 for the MVP.

**Reason:** The app needs fixtures, statuses, unfolded goals, lineups, and squads behind a provider boundary.

### Decision 4: No dependency on frequent cron jobs

**Choice:** On-demand and admin-triggered synchronization.

**Reason:** Frequent live polling is unnecessary for the demo and may conflict with free hosting limits.

### Decision 5: Scoring is deterministic code

**Choice:** Pure TypeScript function with tests.

**Reason:** AI and external services must never determine user points.

### Decision 6: Gemini receives aggregates only

**Choice:** Structured server-created input and structured output.

**Reason:** Reduces hallucination, prompt injection, privacy risk, and cost.

### Decision 7: Called It cards are web pages

**Choice:** Dynamic public pages rather than generated image assets.

**Reason:** Easier to build, verify, share, update, and extend later.

---

## 26. Future Architecture

A later production phase may add:

- Snowflake for large-scale analytics.
- Queue-based result processing.
- Frequent background synchronization.
- Materialized leaderboard views.
- Redis caching and distributed rate limiting.
- Webhooks or live event feeds from the sports provider.
- Multiple competitions and seasons.
- Native mobile clients.
- Social graph recommendations.
- Image-based social cards.
- Auditable prediction commitments.
- Dedicated moderation tools.
- Separate analytics warehouse.

These should be introduced only when scale or product requirements justify them.

---

## 27. Acceptance Criteria

The technical MVP is complete when:

1. The application deploys successfully to Vercel.
2. Users can register with email/password and Google.
3. Protected pages require a valid authenticated session.
4. Users can submit and edit predictions before kickoff.
5. Users cannot edit predictions at or after kickoff.
6. Prediction deadlines are enforced using server time.
7. Confidence limits cannot be bypassed through concurrent requests.
8. Completed matches can be processed idempotently.
9. Score breakdowns match the defined rules.
10. Called It cards appear only for fully correct predictions.
11. Global and friends-filtered leaderboards return correct rankings.
12. Friend predictions remain hidden before kickoff.
13. Gemini summaries use only supplied verified statistics.
14. Public Called It pages expose no private information.
15. Core flows work at mobile and desktop widths.
16. The demo still works using seed data if external APIs fail.

---

## 28. External References

- Next.js documentation: https://nextjs.org/docs
- Next.js App Router: https://nextjs.org/docs/app
- Next.js on Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Supabase server-side auth: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase password authentication: https://supabase.com/docs/guides/auth/passwords
- Supabase Google authentication: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- football-data.org documentation: https://www.football-data.org/documentation/quickstart
- Gemini API documentation: https://ai.google.dev/gemini-api/docs
- Google GenAI SDK libraries: https://ai.google.dev/gemini-api/docs/libraries
- Gemini structured output: https://ai.google.dev/gemini-api/docs/structured-output
