# Called It UI Revamp — Implementation Plan

**Status:** planning only — no application code, schema, or runtime behaviour is changed by this document.  
**Scope:** a complete visual and interaction-system revamp for the existing responsive web app, while preserving the football-prediction product rules and the current acid-lime brand signal.

## 1. Purpose and outcome

Called It should feel like a trusted match-night instrument: quick enough to use one-handed before kickoff, serious enough that results and rankings feel official, and distinctive enough that a shared Called It card looks like proof rather than a generic achievement.

The redesign replaces the current pale, card-heavy, Arial-based presentation with a **dark match-night interface**. It retains lime as the decisive action and verification colour, but uses it sparingly against layered near-black, green-charcoal surfaces. The visual reference is a floodlit stadium concourse and a stamped match ticket—not a cyberpunk dashboard or betting product.

### Design thesis

Every important screen is organised around one question a fan asks at that moment:

- **Before kickoff:** “What do I still need to call?”
- **During a match:** “Is it locked, live, and current?”
- **After a result:** “How did my call score?”
- **Among friends:** “Where do I stand?”

The primary visual signature is the **match ticket rail**: a thin, information-bearing line that runs through match, prediction, result, and Called It-card surfaces. It carries the stage, deadline/lifecycle, and verified state, so the app does not rely on floating pills or colour alone. This is the one deliberate aesthetic risk; the surrounding layout remains quiet and highly legible.

## 2. Product contract and non-negotiable behaviour

This revamp is presentation-led. It must not weaken, hide, or recreate server-owned rules in the browser.

| Product requirement | UI contract |
| --- | --- |
| Prediction deadlines | Show local kickoff time and a clear countdown/lock state, but keep the server/database as the only authority. A client-side countdown never authorises a save. |
| Prediction privacy | Before kickoff, render only the viewer’s own prediction. Never imply that friend predictions are available early. |
| Scores and rankings | Present score breakdowns and leaderboard context clearly; all scoring and ranking calculations remain deterministic and server-owned. |
| Confidence allocations | Make remaining 2× and 3× uses visible before selection, distinguish unavailable from selected, and preserve existing atomic validation. |
| Called It cards | Show cards only from server-issued records. Public pages must continue to reveal only the currently permitted public information. |
| Sports-data freshness | Retain live, pending, confirmed, postponed, cancelled, stale, and sync-time signals. Status needs text and icon/shape as well as colour. |
| Gemini briefings | Keep AI secondary to verified statistics; explain when a briefing is unavailable and never make it appear to determine a rank or score. |
| Seeded/demo fallback | Empty, unavailable, and stale-data states must still leave the demo understandable and usable. |
| Mobile-first use | The prediction journey must remain usable with a thumb at 375px, without horizontal scrolling or hover-only controls. |

The existing product scope remains in force: no betting language, odds, money, private leagues, live chat, crypto, or paid advantages. The redesign should use **calls**, **points**, **rank**, and **verified**, never gambling terminology.

## 3. Current-state audit

The app already has the core routes and server logic needed for a strong redesign: landing, auth, onboarding, dashboard, match desk and prediction form, leaderboards, friends, profile/editing, AI briefings, and public Called It cards. It also already exposes match lifecycle/freshness labels and a one-minute matchdesk refresh.

The visual work should address these observed issues:

- The global page surface is light while the strongest brand surfaces are dark, so the experience changes tone from page to page.
- Arial does not give match scores, ranks, or card claims enough identity.
- Navigation is currently a repeated row of chips and is absent from some app screens; it does not establish a reliable app shell.
- The dashboard is a placeholder rather than a matchday command centre.
- Dense forms and repeated rounded white panels make match, social, and profile content visually similar despite having different jobs.
- Important lifecycle states exist but their colours are tuned for the old light theme and need semantic dark-theme equivalents.
- Several PRD-required surfaces are not yet represented in the current UI: dashboard summaries, match filters, detailed point breakdown/history, password reset, and a consolidated settings view. These need a product-completeness track, not cosmetic placeholders.

## 4. Visual direction

### 4.1 Token system

Use semantic variables rather than page-specific hex values. Exact contrast must be verified in implementation; the values below are the design starting point.

| Role | Token | Hex | Use |
| --- | --- | --- | --- |
| Pitch night | `--canvas` | `#0B100D` | Application background |
| Stand shadow | `--surface-1` | `#121A15` | Navigation, main panels |
| Dugout | `--surface-2` | `#1A251E` | Raised cards and inputs |
| Touchline | `--line` | `#2B3A30` | Borders, dividers, disabled outlines |
| Floodlight | `--text` | `#F1F5EE` | Primary text |
| Terrace fog | `--text-muted` | `#A7B4AA` | Supporting text |
| Signal lime | `--lime` | `#D8F458` | Primary actions, selected call, verified highlights |
| Lime shadow | `--lime-strong` | `#B8DA35` | Hover/pressed lime states |
| Live signal | `--live` | `#FF6B5F` | Live-match marker only, paired with “Live” text |
| Review amber | `--warning` | `#F5B84B` | Pending/manual-review/stale states |
| Confirmed | `--success` | `#74D49B` | Processed result confirmation |

Use a subtle top-to-bottom canvas gradient (`#101812` to `#0B100D`) and restrained 1px rules. Avoid glassmorphism, large gradients, glowing borders, and lime text paragraphs. Lime is a scarce signal: a user should recognise the most important action in a single glance.

### 4.2 Typography

Replace Arial with two purposeful type roles loaded through `next/font`:

- **Display and data: a condensed broadcast face.** The intended web-font direction is Barlow Condensed; the implementation must load it locally or through a checked-in asset before production. Until that asset exists, use the local-safe `Bahnschrift Condensed`, `Arial Narrow`, and `Impact` fallback stack so builds never depend on a Google Fonts network request.
- **Body and controls: a clear humanist sans.** The intended web-font direction is Manrope; the implementation currently uses the local-safe `Trebuchet MS`, `Segoe UI`, and sans-serif fallback stack. A checked-in Manrope asset can replace it later without changing layout tokens.

Use tabular numerals for score, rank, points, dates, and countdowns. Keep body copy sentence case. Uppercase is reserved for brief structural labels such as `ROUND OF 16`, `LOCKS IN 01:24:31`, and `VERIFIED RESULT`.

Suggested scale:

| Context | Mobile | Desktop | Treatment |
| --- | --- | --- | --- |
| Scoreline / rank hero | 48px | 72px | Barlow Condensed, 700–800, tabular |
| Page title | 36px | 52px | Barlow Condensed, 700 |
| Section title | 24px | 30px | Barlow Condensed, 700 |
| Body | 16px | 16px | Manrope, 400–500, 1.5 line-height |
| Control label / metadata | 12–14px | 12–14px | Manrope, 700; restrained letter spacing |

### 4.3 Layout and component language

- Use a **12-column desktop grid**, a **6-column tablet grid**, and a **4-column mobile grid**. Content max width: 1440px; standard content width: 1180px.
- Use 8px spacing increments. Default page gutters: 16px mobile, 24px tablet, 32px desktop.
- Prefer squared-off `12px` and `16px` radii for utility surfaces; reserve the large ticket notch/rail treatment for match cards and Called It cards. This makes the signature memorable rather than ubiquitous.
- Build cards from three surface levels: flat canvas section, raised surface, and ticket surface. Do not put every element inside a bordered card.
- Use simple line icons with text labels for navigation and destructive actions. Introduce an icon library only if the chosen implementation needs it; icon-only controls always need an accessible name and visible tooltip on desktop.

### 4.4 Motion

Motion should communicate a state change, never decorate static screens:

- Match status can pulse once when it transitions to live; no continuous glow.
- A successful saved prediction gets a short rail-fill confirmation and an `aria-live` text update.
- Bottom-sheet and drawer motion uses 160–220ms easing.
- Respect `prefers-reduced-motion`: remove transforms, pulses, automatic scroll movement, and animated skeleton shimmer.

## 5. Information architecture and navigation

### Authenticated shell

Create one shared authenticated layout for `/dashboard`, `/matches`, `/leaderboard`, `/friends`, `/profile`, and future `/settings` routes. It owns navigation, active-route styling, page gutters, and a safe area for mobile navigation.

**Desktop (1024px and up):** fixed left rail with the wordmark, five labelled destinations, a compact user/points block at the bottom, and an optional settings trigger. The main content remains wide and uses the 12-column grid.

**Mobile (below 640px):** fixed bottom navigation with Home, Matches, Rankings, Friends, and Profile. It must have a solid elevated surface, adequate bottom safe-area padding, 44px minimum target sizes, active text plus icon state, and no hidden overflow. Secondary actions go in the page header or a bottom sheet, not the primary nav.

**Tablet (640–1023px):** compact top rail or collapsible side rail; preserve labels until there is evidence icon-only navigation is understood.

### Route inventory

| Route | Primary job | Revamp outcome |
| --- | --- | --- |
| `/` | Explain Called It and get a user to sign up | Dark editorial landing page with a live-looking sample match ticket, score rules, social proof, and clear auth CTAs. |
| `/login`, `/signup`, `/reset-password` | Authenticate without friction | A focused single-column auth stage with clear password/OAuth states and return path. `/reset-password` is a PRD gap to build. |
| `/onboarding` | Create a usable matchday identity | Two-step, low-friction identity + favourite-team flow; preserve existing required fields and server validation. |
| `/dashboard` | Answer “what should I do next?” | Matchday command centre: next call, missing calls, rank/points, friends movement, and earned proof. Requires aggregated data queries currently not present. |
| `/matches` | Browse, filter, make, edit, and revisit calls | Timeline/list match desk with filter drawer, ticket cards, lifecycle rail, and a focused prediction interaction. |
| `/leaderboard` | Compare rank globally or with friends | Sticky scope switcher, current-user context, compact mobile rows, dense desktop table, and optional grounded briefing. |
| `/friends` | Find, manage, and act on friend relationships | Clear request inbox, friend roster, search, and relationship actions grouped by consequence. |
| `/profile` | Review identity, record, cards, and history | Personal match record with identity header, key numbers, prediction-history area, collection, and briefing. Prediction-history data is a PRD gap. |
| `/profile/edit` and `/settings` | Change identity, privacy, and account preferences | A settings hub with profile, privacy/searchability, password, and notification sections. Only implemented server capabilities get active controls. |
| `/cards/[publicSlug]` | Share verified proof publicly | A public, distraction-free proof page with the ticket at the centre, clear verification language, and share action. |

## 6. Screen-level requirements

### Landing and authentication

- Lead with a believable match-ticket moment, not a generic hero statistic: teams, a countdown, a visible “your call stays hidden until kickoff” rule, and a sample verified card lower on the page.
- Include an abbreviated “How points work” explanation that links to a full scoring explainer; do not promise an exact score total that differs from the server rules.
- Keep sign-in and sign-up actions visible in the header and hero. Preserve Google OAuth only where configured.
- Auth forms need persistent labels, password requirements before submission, explicit pending state, error text with recovery action, and password reset route/flow.

### Onboarding and profile setup

- Use a short progress indicator with meaningful steps, not arbitrary numbered decoration: `Your name` then `Your team`.
- Team choice remains a keyboard-operable radio group. Each option includes a crest/initial fallback, name, and selected state that is readable without lime.
- Keep username, display name, and favourite team server-required. Clearly explain what is public/searchable before the user saves optional privacy settings.

### Dashboard

The dashboard becomes a priority stack rather than a welcome page:

1. **Next call:** the nearest scheduled fixture, deadline, current prediction state, and one clear “Make call”/“Edit call” action.
2. **Callboard:** count of unmade calls for the next matchday, remaining confidence allocations, and a link to all fixtures.
3. **Your standing:** total points, global rank, friends rank, and current streak, with data-empty alternatives.
4. **Recent proof:** latest processed result/Called It card or an explicit first-achievement state.
5. **Friends signal:** accepted-friend rank movement or a focused invite/search prompt. Do not introduce a social activity feed unless its data and privacy contract are implemented.

The first two modules require new server-side aggregate queries but no change to scoring or RLS policy. They should be fetched in parallel with the existing profile/stat data and rendered server-side.

### Match desk and prediction interaction

- Preserve separate upcoming/live, results, and fixture-update sections. Add a compact filter bar: status, date/matchday, stage, team, and predicted/unpredicted. On mobile, filters open in a bottom sheet and their applied state is summarised in a single line.
- A match ticket includes: tournament/stage, home/away teams, local date/time, countdown or lifecycle status, the visual ticket rail, freshness text, and prediction state. Postponed/cancelled fixtures remain visible in a dedicated update area.
- Selecting a scheduled fixture opens an expanded inline form on desktop and a focused full-height bottom sheet on mobile. Do not navigate away from the match context unnecessarily.
- Score controls retain large increment/decrement targets, also permit direct numeric keyboard entry, announce changed values, never allow negatives, and show team names beside the controls.
- First-goalscorer selection becomes searchable on mobile when enough player data is available. Include “Skip for now” and “No goalscorer” as distinct choices; selecting no-goalscorer clears/disabled player selection with a clear explanation.
- Confidence selection shows `1×`, `2×`, `3×`, remaining allocations, selected state, and disabled reason. It must not calculate or promise final points in the browser.
- The submission footer stays visible while the prediction sheet/form is in view. It shows the deadline, save/update action, and successful/error status. On a server-rejected late submission, refresh data and show the authoritative locked state.
- Completed cards show the user’s call, result processing state, and—once query support is added—the detailed score breakdown required by the PRD. A pending result never looks final.

### Rankings and friends

- Keep Global/Friends as a sticky, labelled segmented control that retains the query-string scope for shareable/reload-safe state.
- Mobile ranks are compact but show rank, predictor, points, and at least one achievement signal. Desktop retains the data table with exact scores, Called It count, and streak. The current user must be recognisable through an outlined rail and “You” label, not only a background colour.
- Show empty friends rankings as an invitation to add friends, with a safe link to Friends.
- Friends is divided into `Requests to respond to`, `Your rivals`, and `Sent requests`; each relationship action has a clear label. Blocking/removing uses a confirmation pattern because it has a meaningful social consequence.
- Search supports keyboard submission, loading feedback, no-results state, and relationship-specific actions. Search results must respect current RLS/searchability behaviour.

### Profile, AI, and settings

- Profile header shows display name, handle, favourite team, optional bio, visibility signal visible only to the owner, and a direct edit action.
- Put points/rank/streak in a prominent record strip; secondary figures go in an expandable or responsive stats grid.
- Add a prediction-history section only after a privacy-safe server query is defined. It should explain point breakdown after processing and preserve hidden-before-kickoff rules for any non-owner profile view.
- AI briefing uses a clearly secondary “Verified briefing” module. It displays provenance text, generation/loading/retry/unavailable states, and never appears before the user’s real record.
- Settings is grouped by what users control: identity, discoverability/privacy, account/password, and notification preferences. Password reset and notification controls require their real backend support before becoming interactive.

### Called It cards and public proof

- Keep the current dark card as the visual anchor, rebuilt as a precise ticket: notched rail, tournament/stage, verified score, first scorer, confidence, rarity, and owner name.
- The card must pass contrast at all rarity levels and retain readable text when shared or printed.
- Public pages must make status clear: available, hidden by owner, revoked after correction, or unavailable. Do not reveal private predictions or profile fields.
- Native sharing/copy actions need successful/failure feedback and a clipboard fallback. Social preview improvements are optional until an `ImageResponse` path is explicitly scheduled.

## 7. Technical implementation strategy

### Frontend architecture

- Retain Next.js App Router, TypeScript, Tailwind CSS, server components for data reads, server actions for mutations, and existing Supabase/RLS boundaries.
- Add a shared `app/(app)/layout.tsx` shell instead of repeating page padding, background, dashboard links, and navigation in each page.
- Keep route-level server components responsible for authenticated data. Make only truly interactive pieces client components: nav active behaviour if needed, filter sheet, prediction controls, refresh control, action buttons, share actions, and AI refresh.
- Replace raw repeated utility strings with a small `components/ui/` primitive set: `AppShell`, `PageHeader`, `Button`, `IconButton`, `Ticket`, `StatusRail`, `SegmentedControl`, `EmptyState`, `Skeleton`, `Notice`, `BottomSheet`, and `Field`. Primitives expose semantic variants, not page-specific colours.
- Add a `lib/ui/` module for display-only helpers: local date formatting, countdown presentation, status-to-copy mapping, and class composition. It must not duplicate backend scoring, lock, or privacy logic.
- Use `next/font` in the root layout and CSS variables in `globals.css`. Do not use a blocking external stylesheet or make the font a client-side runtime dependency.
- Introduce a minimal accessible icon source only if necessary. Use names/labels alongside icons in critical navigation and actions.

### Data and functional additions

The visual migration itself needs no database migration. The following UI requirements need product-backed queries/actions before their components are enabled:

| Addition | Needed backend work | Security/data boundary |
| --- | --- | --- |
| Dashboard callboard | Aggregated next fixture, own prediction status, counts of missing predictions, allocations, and accepted-friend summary | Authenticated server read; never fetch other users’ pre-kickoff calls |
| Match filters | Extend match query with supported filter inputs and URL search params | Validate allow-listed values server-side; maintain current RLS reads |
| Point breakdown | Query server-owned breakdown fields after result processing | Owner-only before any future profile exposure; no client recalculation |
| Prediction history | Paginated owner-history query with processed state and breakdown | Owner-only by default; any public version needs a separate privacy decision |
| Password reset | Supabase reset-password initiation and update-password routes | Use verified redirect URLs; no account existence disclosure |
| Settings/notifications | Implement only fields/actions backed by existing profile/Auth/notification policies | Do not add inert toggles or client-only saved preferences |

### Accessibility and quality baseline

- Meet WCAG 2.2 AA contrast for text, focus, controls, and status states in the dark theme.
- Provide visible `:focus-visible` rings that contrast with both dark surfaces and lime selection states.
- Use semantic landmarks, one H1 per view, descriptive form labels, grouped radio/checkbox controls, live regions for save/refresh results, and labelled icon buttons.
- Do not use colour as the only lifecycle, freshness, selected, error, or successful-save cue.
- Support keyboard operation for filters, score controls, team choice, segmented controls, friend actions, cards, sheets, and sharing. Bottom sheets must trap focus and restore it on close.
- Test reduced motion, browser zoom at 200%, text-only zoom, and screen-reader announcement of dynamic states.

### Performance and reliability

- Keep server-rendered route shells and defer only non-critical client interactivity.
- Use `next/image` if crest/avatar assets are introduced; provide initials/flag/code fallbacks if an image is absent or fails.
- Keep existing match refresh to one minute; do not add client polling to unrelated pages.
- Maintain skeletons for short reads and explicit error/empty states for long failures. Never replace a valid last-known result with an error panel because a provider refresh failed.
- Avoid shipping a heavyweight animation library for this revamp; CSS transitions and the existing React primitives are sufficient.

## 8. Implementable phases

### Phase 0 — Design inventory and acceptance matrix

**Goal:** turn this plan into a confirmed build contract before changing UI code.

- Create a route-by-route inventory of current components, data dependencies, and PRD requirements.
- Capture baseline screenshots at 375px, 768px, and 1440px for all existing routes and important empty/error states.
- Confirm whether the product owner wants the PRD gaps in this revamp release or visual placeholders only. Recommended: include dashboard, match filters, password reset, and point breakdown; defer notifications, avatar upload, and suggested friends until their backend contracts exist.
- Produce a component/state matrix covering loading, empty, disabled, locked, error, stale, pending, confirmed, postponed, cancelled, and revoked views.

**Exit criteria:** an approved visual direction, route inventory, and explicit decision for each PRD gap. No UI code yet.

### Phase 1 — Tokens, fonts, primitives, and dark-theme foundation

**Goal:** create one consistent visual system without changing application behaviour.

- Replace global colour variables with the semantic dark token system and add semantic status tokens.
- Apply the display/body/data roles through CSS variables. Prefer checked-in font assets or a deployment-safe local font package; do not make production builds depend on an external font fetch.
- Establish base typography, form/reset styles, focus rings, selection colour, reduced-motion rules, and safe-area variables.
- Build/test foundational primitives (`Button`, `Field`, `Ticket`, `StatusRail`, `Notice`, `EmptyState`, `Skeleton`, `SegmentedControl`).
- Update all existing status colour usages to dark-theme semantic variants with text/icon reinforcement.

**Acceptance criteria:** no light-theme remnants on authenticated pages; every primitive has default/hover/focus/disabled/loading/error variants; all existing unit/type/lint checks pass.

### Phase 2 — Shared shell and responsive navigation

**Goal:** make every authenticated screen feel like one product.

- Add the authenticated app layout, desktop rail, mobile bottom navigation, tablet behaviour, active route state, and protected safe-area padding.
- Move duplicate page chrome into `PageHeader`/shell slots while preserving page titles and route links.
- Add a consistent page-level loading and error frame; retain the existing reassurance that saved predictions are safe.
- Verify that the nav remains keyboard reachable and does not obscure submit actions, toast/status messages, or form fields on small screens.

**Acceptance criteria:** Home, Matches, Rankings, Friends, and Profile are reachable from every authenticated route at every breakpoint; no content is hidden under mobile navigation.

### Phase 3 — Entry, identity, and matchday command centre

**Goal:** make entry and the first logged-in decision clear.

- Revamp landing, login, signup, password-reset flow, onboarding, and profile edit using the new type and ticket language.
- Build the dashboard priority stack and its empty states.
- Add the dashboard aggregate read model only after defining and testing its authenticated server-query contract.
- Preserve current onboarding redirects and completion enforcement.

**Acceptance criteria:** a new user can sign up, complete profile requirements, understand why a favourite team is required, and reach their next call without a dead end. Existing server-side validation messages remain visible and understandable.

### Phase 4 — Match desk and prediction flow

**Goal:** make a prediction feel fast, deliberate, and impossible to misunderstand.

- Build filter bar/bottom sheet and URL-driven filtering.
- Rebuild match cards as tickets with lifecycle rail, freshness, local time, score/result, and prediction state.
- Rebuild the score, goalscorer, and confidence controls; add focused mobile prediction sheet and desktop expanded layout.
- Add score-breakdown display only when the server query is ready. Reconcile any stale response with the authoritative match state.
- Preserve postponed/cancelled sections, live lock messaging, auto-refresh, manual refresh, and `aria-live` feedback.

**Acceptance criteria:** users can save/edit a valid prediction before kickoff, understand unavailable multipliers, and see a server-authoritative locked state after kickoff; privacy and scoring tests continue to pass.

### Phase 5 — Social competition and personal record

**Goal:** make rank and relationships motivating without making the app noisy.

- Rebuild leaderboard table/compact rows, scope control, current-user treatment, zero-data state, and friends briefing placement.
- Rebuild friends search, result rows, request inbox, outgoing list, friend roster, and high-consequence confirmations.
- Rebuild profile header, record strip, stat grid, collection, and verified briefing.
- Add paginated prediction history only after the owner-only query and privacy rules are specified and tested.

**Acceptance criteria:** every friend state remains actionable and understandable; leaderboard scope remains URL-backed; the current user is apparent without relying on lime alone; no non-owner data leaks before kickoff.

### Phase 6 — Proof surfaces, states, and product-completeness views

**Goal:** give every outcome a clear, branded, accessible state.

- Rebuild Called It card, public proof page, share controls, unavailable/revoked page, and metadata copy.
- Complete loading, empty, stale, unavailable, manual-review, and error states across all routes.
- Build the settings hub and password flow; activate privacy/searchability fields already supported by the server.
- Decide separately on avatar upload, notification preferences, suggested friends, country filters, and public profile routes. They must not be visually implied as available before implementation.

**Acceptance criteria:** a shared card looks recognisably like Called It at a glance; public/private/revoked states are unambiguous; every major route has a purposeful empty and failure state.

### Phase 7 — Verification, polish, and release readiness

**Goal:** verify the redesign is more usable without compromising the MVP.

- Run unit tests for new display/state helpers and component interactions.
- Add/extend authenticated integration coverage for dashboard data, filters, prediction save/edit/lock, point breakdown visibility, and settings/password flows introduced by the revamp.
- Add Playwright smoke coverage for sign-up/onboarding, prediction submission, lock-after-kickoff response, leaderboard scope, friend action, card sharing, and public-card revocation.
- Perform manual visual/accessibility passes at 375px, 768px, and 1440px; test keyboard-only navigation, reduced motion, 200% zoom, and narrow mobile safe areas.
- Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`; inspect build output for font loading, hydration, and client-bundle regressions.

**Acceptance criteria:** all MVP acceptance criteria still hold, no route horizontally scrolls at target sizes, dark-theme contrast is verified, and release screenshots show a coherent system.

## 9. Delivery order and dependencies

`Phase 1 → Phase 2 → Phase 3/4/5 (can partially overlap by route) → Phase 6 → Phase 7`

Do not begin a route’s visual rebuild until its relevant primitive states exist. Do not activate any product-completeness control until its query/action is implemented and covered. The data additions in Phases 3–6 should be small, isolated server reads/actions; they do not authorise changes to scoring, RLS, sync, or result-processing logic.

## 10. Definition of done

The UI revamp is complete when:

1. The app has a coherent dark match-night visual system with the retained lime accent and no Arial.
2. Authenticated routes share responsive desktop/tablet/mobile navigation.
3. Every core MVP journey—auth, onboarding, predict, lock, result, ranking, friend action, profile, and card sharing—is clear at 375px, 768px, and 1440px.
4. Lifecycle, freshness, privacy, confidence, and scoring states are legible without colour alone.
5. All new UI interactions preserve existing server-side validation, RLS, deterministic scoring, and provider-fallback behaviour.
6. PRD-required additions included in the release have real, tested backend contracts; deferred items are absent rather than simulated.
7. Accessibility, automated tests, production build, and authenticated browser smoke coverage pass or any remaining limitation is explicitly recorded in `MEMORY.md`.

## 11. Decisions requested before implementation

- Confirm that **Barlow Condensed + Manrope** is the desired replacement for Arial, or name a font direction you prefer (more editorial, more playful, or more neutral).
- Confirm the recommended product-completeness scope: dashboard aggregates, match filters, password reset, and point breakdown in this revamp; defer avatar upload, notifications, suggested friends, and country filtering.
- Confirm whether the landing page should use real upcoming fixture data after deployment or a clearly labelled static/demo match ticket for reliability.
