# Called It — Mobile Responsive Fix Plan

## Problem statement

The desktop UI is correct and should not change. On mobile (320px–428px), the app feels like a shrunken desktop layout rather than a purpose-built mobile experience. Three symptoms dominate:

1. **Landing page is too vertical** — the hero fills the viewport with oversized type, the receipt card sits far below the fold, and the features section requires excessive scrolling.
2. **Typography is too large everywhere** — display headings use `text-5xl`–`text-8xl` (48px–96px) with no mobile step-down. At 375px, a `text-7xl` heading (72px) consumes nearly the full screen width for two words.
3. **Match cards overflow horizontally** — the prediction form's score controls (`w-20` input + two `h-10 w-10` buttons = 176px) sit inside `grid-cols-[1fr_auto_1fr]` columns that are only ~120px wide on a 375px screen, causing the cards to stretch beyond the viewport.

## Design principles for this fix

- **Mobile-first type scale.** Add a `text-3xl` or `text-4xl` base for every display heading, then scale up at `sm:` and `lg:`. Desktop classes stay untouched.
- **No horizontal overflow at 320px.** Every flex and grid container must either wrap, truncate, or collapse gracefully. No `min-width` or fixed-width elements that exceed the viewport minus padding.
- **Compact vertical rhythm on mobile.** Reduce gaps, margins, and padding on mobile so content is reachable without excessive scrolling. Desktop spacing stays the same.
- **Touch targets stay ≥ 44px.** No fix may reduce a clickable/tappable surface below 44px minimum dimension.
- **Desktop is frozen.** Every change adds or modifies mobile-default classes only. No `sm:`/`md:`/`lg:` breakpoint values change.

---

## Issue inventory

### 1. Landing page (`app/page.tsx`) — too vertical, text too big

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 1a | Hero section | `min-h-[calc(100vh-80px)]` | Forces hero to fill entire viewport; receipt card is below the fold | Remove `min-h` on mobile; add `min-h-0 lg:min-h-[calc(100vh-80px)]` |
| 1b | Hero heading | `text-7xl sm:text-8xl` | 72px heading wraps awkwardly; each line dominates | Change to `text-4xl sm:text-7xl lg:text-8xl` |
| 1c | Hero gap | `gap-14` | 56px gap between text and receipt card wastes space | Change to `gap-8 lg:gap-14 lg:gap-20` (note: already has `lg:gap-20`) |
| 1d | Receipt card score | `text-7xl` | 72px "2-1" overflows the card | Change to `text-4xl sm:text-7xl` |
| 1e | Receipt card padding | `p-5 pt-8 sm:p-7 sm:pt-10` | OK but could be tighter | Change to `p-4 pt-6 sm:p-7 sm:pt-10` |
| 1f | Hero padding | `py-14` | 56px top/bottom padding is generous | Change to `py-10 lg:py-20` |
| 1g | Feature numbers + titles | `text-3xl` each | Two large headings per feature card make each card tall | Change to `text-2xl sm:text-3xl` for both |
| 1h | Features section padding | `py-16` | 64px vertical padding | Change to `py-10 sm:py-16` |
| 1i | Features gap | `gap-10` | 40px between stacked features | Change to `gap-6 sm:gap-10` |
| 1j | Nav brand text | `text-2xl` | 24px "CALLED IT" crowds with CTA on narrow screens | Change to `text-xl sm:text-2xl` |
| 1k | Subtitle paragraph | `text-base leading-8` | 16px/32px line-height is generous | Change to `text-sm leading-6 sm:text-base sm:leading-8` |
| 1l | CTA button margin | `mt-9` | 36px top margin | Change to `mt-6 sm:mt-9` |
| 1m | Stats row margin | `mt-12` | 48px top margin | Change to `mt-8 sm:mt-12` |

### 2. PageHeader (`components/ui/primitives.tsx`) — affects every authenticated page

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 2a | Title | `text-5xl sm:text-6xl` | 48px heading fills width; long titles wrap badly | Change to `text-3xl sm:text-5xl lg:text-6xl` |
| 2b | Header gap | `gap-5` | 20px gap between title and action | Change to `gap-3 sm:gap-5` |
| 2c | Header bottom padding | `pb-7` | 28px bottom border padding | Change to `pb-5 sm:pb-7` |

### 3. Dashboard (`app/(app)/dashboard/page.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 3a | Page heading | `text-6xl sm:text-7xl` | 60px; wraps to 3+ lines | Change to `text-4xl sm:text-6xl lg:text-7xl` |
| 3b | Section gap | `space-y-8` | 32px between every section | Change to `space-y-6 sm:space-y-8` |
| 3c | CTA heading | `text-5xl sm:text-6xl` | 48px inside padded card | Change to `text-3xl sm:text-5xl lg:text-6xl` |
| 3d | CTA card padding | `p-5 pt-7 sm:p-7 sm:pt-9` | OK but could tighten | Change to `p-4 pt-6 sm:p-7 sm:pt-9` |
| 3e | StatCard value | `text-5xl` | 48px "—" in stacked cards | Change to `text-3xl sm:text-5xl` |
| 3f | StatCard padding | `p-5` | 20px padding on small cards | Change to `p-4 sm:p-5` |
| 3g | Section grid gap | `gap-5` | 20px between stacked cards | Change to `gap-4 sm:gap-5` |
| 3h | How-it-works card padding | `p-6` | 24px padding | Change to `p-4 sm:p-6` |
| 3i | Social edge heading | `text-3xl` | 30px; no mobile reduction | Change to `text-2xl sm:text-3xl` |

### 4. Match card (`components/matches/match-card.tsx`) — cards overflow on mobile

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 4a | Finished score | `text-5xl` | 48px score; no mobile reduction | Change to `text-3xl sm:text-5xl` |
| 4b | Card padding | `p-5 pt-8 sm:p-6 sm:pt-9` | 20px side padding eats into narrow screen | Change to `p-4 pt-7 sm:p-6 sm:pt-9` |
| 4c | "CALL"/"RESULT" label | `text-xl` | 20px label crowds header | Change to `text-lg sm:text-xl` |
| 4d | Team crest size | `size={44}` | 44px crests in ~120px columns | Change to `size={32}` on mobile via parent wrapper or conditional: use `size={36}` as compromise |
| 4e | Team name | `text-sm sm:text-base` | Already responsive; OK | No change |
| 4f | Team name margin | `mt-3` | 12px below crest | Change to `mt-2 sm:mt-3` |

### 5. Prediction form (`components/matches/prediction-form.tsx`) — the core overflow source

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 5a | Score input font | `text-6xl` | 60px digit inside 80px-wide input | Change to `text-4xl sm:text-6xl` |
| 5b | Score input width | `w-20` | 80px fixed; too wide for mobile columns | Change to `w-14 sm:w-20` |
| 5c | Decrement/increment buttons | `h-10 w-10` | 40px buttons flanking 80px input = 176px total | Change to `h-9 w-9 sm:h-10 sm:w-10` |
| 5d | Score controls gap | `gap-2` | 8px between buttons and input | Change to `gap-1.5 sm:gap-2` |
| 5e | Score control grid gap | `gap-3` | 12px between team columns and center | Change to `gap-2 sm:gap-3` |
| 5f | Team crest in ScoreControl | `size={36}` | 36px crest adds vertical bulk | Change to `size={28} sm:size={36}` (requires conditional or wrapper) |
| 5g | Form top margin | `mt-7` | 28px above form | Change to `mt-5 sm:mt-7` |
| 5h | Form top padding | `pt-6` | 24px padding | Change to `pt-4 sm:pt-6` |
| 5i | Fieldset margin | `mt-5` | 20px between fieldsets | Change to `mt-4 sm:mt-5` |
| 5j | Confidence grid gap | `gap-2` | 8px between 3 buttons | OK; no change |
| 5k | Button full width | `w-full` | Already full-width; good | No change |

### 6. Onboarding (`app/(app)/onboarding/page.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 6a | Hero heading | `text-6xl sm:text-7xl` | 60px in ~263px usable width | Change to `text-4xl sm:text-6xl lg:text-7xl` |
| 6b | Form heading | `text-4xl sm:text-5xl` | 36px; wraps in narrow panel | Change to `text-2xl sm:text-4xl lg:text-5xl` |
| 6c | Panel padding | `p-7 pt-10 sm:p-10 sm:pt-12` | 28px side padding | Change to `p-5 pt-8 sm:p-10 sm:pt-12` |
| 6d | Grid gap | `gap-6` | 24px between stacked panels | Change to `gap-4 sm:gap-6` |
| 6e | Page padding | `px-5 py-8 sm:px-8` | 20px side padding; OK | No change |
| 6f | Hero bottom decoration margin | `mt-14` | 56px; wastes space | Change to `mt-8 sm:mt-14` |

### 7. Auth form (`components/auth/auth-form.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 7a | Heading | `text-5xl` | 48px; no mobile reduction | Change to `text-3xl sm:text-5xl` |
| 7b | Form top margin | `mt-10 lg:mt-20` | 40px on mobile | Change to `mt-6 sm:mt-10 lg:mt-20` |
| 7c | Form padding | `p-6 sm:p-10` | 24px side padding | OK; no change |

### 8. Reset password (`app/(auth)/reset-password/page.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 8a | Heading | `text-5xl` | 48px; no mobile reduction | Change to `text-3xl sm:text-5xl` |

### 9. Profile page (`app/(app)/profile/page.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 9a | Stat values | `text-4xl` | 36px in ~170px cells; tight with long values | Change to `text-2xl sm:text-4xl` |
| 9b | Stat cell padding | `p-4 sm:p-5` | 16px; OK | No change |

### 10. Called It card (`components/cards/called-it-card.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 10a | Score display | `text-6xl` | 60px score; no mobile reduction | Change to `text-4xl sm:text-6xl` |
| 10b | Card padding | `p-5 sm:p-7` | 20px; OK | No change |

### 11. Result row (`components/matches/result-row.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 11a | Score | `text-4xl sm:text-5xl` | 36px; borderline OK | Change to `text-3xl sm:text-5xl` |
| 11b | Breakdown grid | `grid-cols-2` | "Goal difference" wraps in half-width | Change to `grid-cols-1 sm:grid-cols-2` |
| 11c | Card padding | `p-4 sm:p-5` | 16px; OK | No change |

### 12. Insight panel (`components/ai/insight-panel.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 12a | Title | `text-3xl` | 30px; no mobile reduction | Change to `text-2xl sm:text-3xl` |
| 12b | Summary headline | `text-3xl` | 30px; no mobile reduction | Change to `text-2xl sm:text-3xl` |
| 12c | Content padding | `p-5 sm:p-7` | 20px; OK | No change |

### 13. EmptyState (`components/ui/primitives.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 13a | Title | `text-3xl` | 30px; borderline | Change to `text-2xl sm:text-3xl` |
| 13b | Padding | `px-6 py-12` | 48px vertical padding is tall | Change to `px-5 py-8 sm:px-6 sm:py-12` |

### 14. Matches page (`app/(app)/matches/page.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 14a | PageHeader action | `flex items-center gap-2` | "Results archive" button + refresh button crowd | Wrap: add `flex-wrap` to the action container |
| 14b | Section heading | `text-3xl` | 30px; OK | No change |

### 15. Leaderboard table (`components/social/leaderboard-table.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 15a | Rank number | `text-3xl` | 30px; large for stacked card | Change to `text-2xl sm:text-3xl` |
| 15b | Value strong | `text-2xl` | 24px; OK | No change |
| 15c | Row padding | `px-5 py-4` | 20px side padding | Change to `px-4 py-3 sm:px-5 sm:py-4` |

### 16. App shell mobile header (`components/ui/app-shell.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 16a | Brand text | `text-2xl` | 24px next to avatar; OK | No change |
| 16b | Mobile header padding | `px-4 py-4` | 16px; OK | No change |

### 17. Profile edit (`app/(app)/profile/edit/page.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 17a | Heading | `text-4xl` | 36px; no mobile reduction | Change to `text-2xl sm:text-4xl` |
| 17b | Card padding | `p-6 sm:p-10` | 24px; OK | No change |

### 18. Results archive (`app/(app)/matches/results/page.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 18a | Filter form padding | `p-5` | 20px; OK | No change |
| 18b | Pagination buttons | `px-4 py-2.5` | OK; touch targets met | No change |

### 19. Public card page (`app/cards/[publicSlug]/page.tsx`)

| # | Element | Current | Issue at 375px | Fix |
|---|---------|---------|----------------|-----|
| 19a | Heading | `text-4xl sm:text-5xl` | 36px; OK for a public share page | No change |

---

## Implementation phases

### Phase 1 — Global type scale fix (highest impact, lowest risk)

**Files:** `components/ui/primitives.tsx`, `app/page.tsx`, `app/(app)/dashboard/page.tsx`, `app/(app)/onboarding/page.tsx`, `components/auth/auth-form.tsx`, `app/(auth)/reset-password/page.tsx`, `app/(app)/profile/page.tsx`, `app/(app)/profile/edit/page.tsx`

**What:** Add mobile-first step-downs to every display heading. The pattern is consistent:

| Role | Mobile | sm (640px) | lg (1024px) |
|------|--------|------------|-------------|
| Page hero (landing, onboarding) | `text-4xl` | `text-7xl` | `text-8xl` |
| Page heading (authenticated pages) | `text-3xl` | `text-5xl` | `text-6xl` |
| Section heading (cards, panels) | `text-2xl` | `text-3xl` | — |
| Stat/display value | `text-2xl` or `text-3xl` | `text-4xl` or `text-5xl` | — |
| Score display (match/card) | `text-3xl` or `text-4xl` | `text-5xl` or `text-6xl` | — |
| Score input (prediction form) | `text-4xl` | `text-6xl` | — |

**Validation:** Visual check at 375px, 768px, 1440px. No desktop classes change.

### Phase 2 — Match card and prediction form overflow fix (critical)

**Files:** `components/matches/match-card.tsx`, `components/matches/prediction-form.tsx`

**What:**
1. Reduce score input from `w-20` to `w-14 sm:w-20` and font from `text-6xl` to `text-4xl sm:text-6xl`.
2. Reduce increment/decrement buttons from `h-10 w-10` to `h-9 w-9 sm:h-10 sm:w-10`.
3. Reduce score controls gap from `gap-2` to `gap-1.5 sm:gap-2`.
4. Reduce the score control grid gap from `gap-3` to `gap-2 sm:gap-3`.
5. Reduce card padding from `p-5 pt-8` to `p-4 pt-7 sm:p-6 sm:pt-9`.
6. Reduce finished score from `text-5xl` to `text-3xl sm:text-5xl`.
7. Reduce "CALL"/"RESULT" label from `text-xl` to `text-lg sm:text-xl`.

**Validation:** At 375px, the prediction form's score controls must fit within the card without horizontal overflow. The total width of one score control row is: 36px (decrement) + 6px gap + 56px (input) + 6px gap + 36px (increment) = 140px. Each `1fr` column in a 375px - 32px (card padding) = 343px grid with `gap-2` (8px) gets: (343 - 8) / 2 = ~167px. The 140px row fits comfortably.

### Phase 3 — Landing page vertical compression

**Files:** `app/page.tsx`

**What:**
1. Remove forced viewport height: `min-h-[calc(100vh-80px)]` → `min-h-0 lg:min-h-[calc(100vh-80px)]`.
2. Reduce hero gap: `gap-14` → `gap-8 lg:gap-20`.
3. Reduce hero padding: `py-14` → `py-10 lg:py-20`.
4. Reduce receipt card score: `text-7xl` → `text-4xl sm:text-7xl`.
5. Reduce receipt card padding: `p-5 pt-8` → `p-4 pt-6 sm:p-7 sm:pt-10`.
6. Reduce feature text: `text-3xl` → `text-2xl sm:text-3xl` (both number and title).
7. Reduce features section padding: `py-16` → `py-10 sm:py-16`.
8. Reduce features gap: `gap-10` → `gap-6 sm:gap-10`.
9. Reduce nav brand: `text-2xl` → `text-xl sm:text-2xl`.
10. Reduce subtitle: `text-base leading-8` → `text-sm leading-6 sm:text-base sm:leading-8`.
11. Reduce CTA margin: `mt-9` → `mt-6 sm:mt-9`.
12. Reduce stats row margin: `mt-12` → `mt-8 sm:mt-12`.

**Validation:** At 375px, the hero should not fill the entire viewport. The receipt card should be visible without scrolling or with minimal scrolling. The features section should be reachable within 2–3 scrolls.

### Phase 4 — Spacing and layout tightening

**Files:** `app/(app)/dashboard/page.tsx`, `app/(app)/onboarding/page.tsx`, `components/cards/called-it-card.tsx`, `components/matches/result-row.tsx`, `components/ai/insight-panel.tsx`, `components/ui/primitives.tsx` (EmptyState), `app/(app)/matches/page.tsx`, `components/social/leaderboard-table.tsx`

**What:**
1. Dashboard: `space-y-8` → `space-y-6 sm:space-y-8`; CTA card `p-5 pt-7` → `p-4 pt-6 sm:p-7 sm:pt-9`; StatCard `text-5xl` → `text-3xl sm:text-5xl`, `p-5` → `p-4 sm:p-5`; section gaps `gap-5` → `gap-4 sm:gap-5`; how-it-works `p-6` → `p-4 sm:p-6`; social heading `text-3xl` → `text-2xl sm:text-3xl`.
2. Onboarding: panel padding `p-7 pt-10` → `p-5 pt-8 sm:p-10 sm:pt-12`; grid gap `gap-6` → `gap-4 sm:gap-6`; hero decoration `mt-14` → `mt-8 sm:mt-14`.
3. Called It card: score `text-6xl` → `text-4xl sm:text-6xl`.
4. Result row: score `text-4xl` → `text-3xl sm:text-5xl`; breakdown `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`.
5. Insight panel: titles `text-3xl` → `text-2xl sm:text-3xl`.
6. EmptyState: title `text-3xl` → `text-2xl sm:text-3xl`; padding `px-6 py-12` → `px-5 py-8 sm:px-6 sm:py-12`.
7. Matches page: action container add `flex-wrap`.
8. Leaderboard table: rank `text-3xl` → `text-2xl sm:text-3xl`; row padding `px-5 py-4` → `px-4 py-3 sm:px-6 sm:py-4`.

### Phase 5 — Auth and profile polish

**Files:** `components/auth/auth-form.tsx`, `app/(auth)/reset-password/page.tsx`, `app/(app)/profile/page.tsx`, `app/(app)/profile/edit/page.tsx`

**What:**
1. Auth form: heading `text-5xl` → `text-3xl sm:text-5xl`; form margin `mt-10` → `mt-6 sm:mt-10 lg:mt-20`.
2. Reset password: heading `text-5xl` → `text-3xl sm:text-5xl`.
3. Profile stats: values `text-4xl` → `text-2xl sm:text-4xl`.
4. Profile edit: heading `text-4xl` → `text-2xl sm:text-4xl`.

---

## Validation checklist

After all phases:

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm test -- --run` passes (all existing tests green)
- [ ] Visual check at 375px: landing page hero does not fill viewport; receipt card visible
- [ ] Visual check at 375px: match card with prediction form does not overflow horizontally
- [ ] Visual check at 375px: all headings are readable without horizontal scroll
- [ ] Visual check at 375px: touch targets remain ≥ 44px
- [ ] Visual check at 768px: intermediate breakpoint looks correct
- [ ] Visual check at 1440px: desktop is visually identical to before (no regressions)
- [ ] No `sm:`/`md:`/`lg:` breakpoint values were modified

---

## Files changed (summary)

| File | Phase | Changes |
|------|-------|---------|
| `app/page.tsx` | 1, 3 | Hero type scale, spacing, receipt card |
| `components/ui/primitives.tsx` | 1, 4 | PageHeader title, EmptyState title/padding |
| `app/(app)/dashboard/page.tsx` | 1, 4 | Heading, CTA, StatCard, spacing |
| `app/(app)/onboarding/page.tsx` | 1, 4 | Heading, panel padding, spacing |
| `components/matches/match-card.tsx` | 2, 4 | Score display, card padding, label |
| `components/matches/prediction-form.tsx` | 2 | Score input, buttons, gaps |
| `components/auth/auth-form.tsx` | 5 | Heading, form margin |
| `app/(auth)/reset-password/page.tsx` | 5 | Heading |
| `app/(app)/profile/page.tsx` | 1, 4 | Stat values |
| `app/(app)/profile/edit/page.tsx` | 5 | Heading |
| `components/cards/called-it-card.tsx` | 4 | Score display |
| `components/matches/result-row.tsx` | 4 | Score, breakdown grid |
| `components/ai/insight-panel.tsx` | 4 | Titles |
| `app/(app)/matches/page.tsx` | 4 | Action container wrap |
| `components/social/leaderboard-table.tsx` | 4 | Rank number, row padding |

**Total files:** 15
**Estimated changes:** ~60 class modifications, all additive mobile defaults or narrowing of existing mobile defaults. Zero desktop breakpoint changes.
