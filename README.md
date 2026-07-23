# ShredOS — Phase 1A

Private performance coaching dashboard for fat loss, strength, and running.

---

## Current status (Phase 1V)

This README was originally written for Phase 1A, and several of its
sections (file tree, RLS policy summary, deferred features, and the
Phase 1A testing checklist) still describe the app as it stood then.
The app has since progressed through Phase 1V and is live for
controlled buddy testing — see **Live deployment** below. Those older
sections haven't been rewritten yet; treat them as historical context
rather than current documentation until a full docs refresh happens
(see **Watch list before wider testing** near the end of this file).

---

## Live deployment

- **URL:** https://shredos-pi.vercel.app/
- **Status:** private beta / buddy testing (Phase 1T) — not a public service
- **Repo:** https://github.com/Jayc92/Shredos.git (private)

Root `/` redirects to `/dashboard` (signed in) or `/login` (signed out).

---

## Tech stack

- **Next.js 14** — App Router, TypeScript, server components
- **Tailwind CSS** — dark-mode-first, mobile-first
- **shadcn/ui** — Radix primitives, install via CLI (see below)
- **Supabase** — Postgres + Auth (magic link)
- **React Query** — client-side state/caching
- **date-fns** — date arithmetic

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ShredOS
```

Get your Supabase URL and anon key from:
**supabase.com → your project → Settings → API**

### Production (Vercel)

`NEXT_PUBLIC_APP_URL` must match the real deployed URL
(`https://shredos-pi.vercel.app`), not `localhost`. This value feeds
directly into the magic-link and sign-up email redirect
(`emailRedirectTo`) — if it's left at the `.env.example` default,
confirmation emails sent to remote testers will redirect back to
`localhost` and silently fail.

---

## Supabase setup

### Option A — Hosted Supabase (recommended to start)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of:
   `supabase/migrations/001_phase1a_schema.sql`
3. Go to **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. Go to **Authentication → Providers → Email**:
   - Enable **Magic Link**
   - Disable "Confirm email" if you want instant access

### Option B — Local Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Init (if not already done)
supabase init

# Start local Postgres + Auth
supabase start

# Apply the migration
supabase db push

# The CLI will print your local URL + anon key — put these in .env.local
```

### Generate TypeScript types (optional, after schema is set)

```bash
npx supabase gen types typescript \
  --project-id your-project-ref \
  > src/types/database.ts
```

---

## Local dev setup

```bash
# 1. Install dependencies
npm install

# 2. Install shadcn/ui + add required components
npx shadcn@latest init
npx shadcn@latest add button card input label select badge separator toast switch

# 3. Run the dev server
npm run dev

# → Open http://localhost:3000
```

---

## File tree summary

```
shredos/
├── .env.example
├── .gitignore
├── components.json            # shadcn/ui config
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
│
├── supabase/
│   └── migrations/
│       └── 001_phase1a_schema.sql
│
└── src/
    ├── middleware.ts           # session refresh + protected route guard
    │
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx          # root layout, dark mode
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── auth/callback/route.ts
    │   ├── (app)/
    │   │   ├── layout.tsx      # app shell (sidebar + topbar)
    │   │   ├── dashboard/page.tsx
    │   │   ├── onboarding/page.tsx
    │   │   ├── profile/page.tsx
    │   │   ├── weigh-in/page.tsx
    │   │   ├── nutrition/page.tsx
    │   │   ├── fasting/page.tsx
    │   │   └── decisions/page.tsx
    │   └── api/
    │       ├── auth/signout/route.ts
    │       └── decisions/route.ts
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx
    │   │   └── TopBar.tsx
    │   ├── dashboard/
    │   │   ├── WeightCard.tsx
    │   │   ├── NutritionCard.tsx
    │   │   ├── FastingCard.tsx    ← client component (live timer)
    │   │   ├── StepsCard.tsx
    │   │   ├── WorkoutCard.tsx
    │   │   ├── CoachAlertsCard.tsx
    │   │   └── DecisionLogCard.tsx
    │   ├── onboarding/
    │   │   ├── OnboardingWizard.tsx
    │   │   ├── Step1Bio.tsx
    │   │   ├── Step2Goals.tsx
    │   │   ├── Step3Schedule.tsx
    │   │   └── Step4Nutrition.tsx
    │   ├── weigh-in/
    │   │   ├── WeighInForm.tsx
    │   │   └── WeighInHistory.tsx
    │   ├── fasting/
    │   │   ├── FastingTimer.tsx
    │   │   ├── FastingControls.tsx
    │   │   ├── FastingHistory.tsx
    │   │   └── FastingStats.tsx
    │   └── decisions/
    │       ├── DecisionCard.tsx
    │       └── DecisionList.tsx
    │
    ├── lib/
    │   ├── constants.ts        # PROTECTED_ROUTES, isProtectedRoute(), app constants
    │   ├── utils.ts            # cn() for shadcn
    │   ├── units.ts            # lbsToKg, kgToLbs, feetInchesToCm, calculateBMI
    │   ├── nutrition.ts        # calculateNutritionTargets() — sex-aware + carb guardrail
    │   ├── weighIn.ts          # getTrendConfidence(), getNextWeighInDate()
    │   ├── fasting.ts          # getFastingDuration(), milestones, weekStats
    │   ├── dates.ts            # formatDate helpers
    │   └── supabase/
    │       ├── client.ts
    │       ├── server.ts       # + convenience fetch helpers
    │       └── middleware.ts   # updateSession()
    │
    ├── types/
    │   ├── database.ts         # TypeScript types matching schema
    │   └── app.ts              # App-level types
    │
    └── hooks/
        ├── useProfile.ts
        ├── useWeighIns.ts
        ├── useFasting.ts
        ├── useNutritionTargets.ts
        └── useDecisions.ts
```

---

## RLS policy summary

All five user-owned tables have Row Level Security enabled. Every policy uses `auth.uid()`.

| Table | Policy strategy |
|---|---|
| `user_profiles` | Explicit SELECT / INSERT / UPDATE / DELETE — one policy per operation |
| `body_metrics` | `FOR ALL` — same user_id check covers all operations |
| `nutrition_targets` | `FOR ALL` |
| `fasting_logs` | `FOR ALL` |
| `decision_logs` | `FOR ALL` |

Unauthenticated requests return empty arrays (not errors). The anon key is safe to expose because RLS prevents any cross-user data access.

---

## Key design decisions

### Internal metric, imperial UI
All weights stored in **kg**, heights in **cm**. Displayed as lbs / ft-in via `units.ts`. This prevents rounding drift from repeated conversions.

### BMI is app-calculated
Not a generated column. Height is in `user_profiles`; weight is in `body_metrics`. Call `calculateBMI(weightKg, heightCm)` from `units.ts`. A Postgres view can be added later for analytics.

### Carb guardrail
`calculateNutritionTargets()` in `lib/nutrition.ts` warns if carbs fall below 75g/day after protein and fat allocation. Returns a `warnings` array and a `low_carb_warning` boolean. Does not block save.

### Sex-aware protein threshold
- Male ≥25% BF → uses lean body mass for protein target
- Female ≥35% BF → uses lean body mass for protein target
- Unknown/prefer_not_to_say → bodyweight, with an optional note

### Fasting duration — NOT stored
`duration_minutes` is not in the database. Calculated in `lib/fasting.ts` from `started_at` / `ended_at`. The live timer in `FastingTimer.tsx` uses `setInterval` to tick every second client-side.

### One active fast per user — DB-level constraint
```sql
CREATE UNIQUE INDEX fasting_logs_one_active_fast_per_user
ON fasting_logs (user_id) WHERE ended_at IS NULL;
```
The app also checks before starting, but the DB is the final guard. Error code `23505` is caught and surfaces "You already have an active fast."

### Decision log — nothing changes silently
Every target change (calorie edit, step goal change, fasting goal change, weigh-in cadence change) creates a `decision_logs` row. Status lifecycle: `suggested → accepted / dismissed → applied / reversed`.

### Weigh-in — no daily pressure
Default cadence: weekly / Friday / morning. Dashboard shows trend confidence (`none → low → medium → high`). No recommendations below `medium`. Strong recommendations only at `high` (4+ weigh-ins for weekly cadence).

---

## Deferred features (Phase 1B and beyond)

| Feature | Phase |
|---|---|
| Food logging (manual macro entry) | 1B |
| Food label photo import | 2C |
| Natural-language food math | 2C |
| Workout planner + lift log | 1C |
| Exercise library | 1C |
| Running plans + sessions | 2B |
| Claude API coaching | 2A |
| Progress charts | 2A |
| Wearable sync | 3 |
| Push notifications | 3 |
| Barcode scanner | 3 |

---

## Phase 1A testing checklist

Work through this list before starting Phase 1B.

### Authentication
- [ ] Unauthenticated visit to `/dashboard` → redirects to `/login`
- [ ] Unauthenticated visit to `/weigh-in`, `/nutrition`, `/fasting`, `/decisions`, `/profile`, `/onboarding` → all redirect to `/login`
- [ ] Magic link email received and clicking it starts a session
- [ ] First login with no profile → redirected to `/onboarding`
- [ ] Returning user with complete profile → lands on `/dashboard`
- [ ] Sign out clears session and redirects to `/login`
- [ ] Two separate accounts: user A cannot see user B's data (verify in Supabase Table Editor)

### Onboarding
- [ ] All 4 steps are accessible and navigable forward/back
- [ ] Height entered as 6ft 1in stored as 185.4 cm in database
- [ ] Weight entered as 185 lbs stored as 83.91 kg in database
- [ ] Step 3 shows weigh-in framing: "ShredOS tracks your weight on your schedule. Most users weigh in once a week on Friday morning. You can change this anytime. No daily pressure."
- [ ] Weigh-in cadence defaults to weekly / day defaults to Friday / time defaults to morning
- [ ] No daily weigh-in pressure visible anywhere in the onboarding flow
- [ ] Step 4 shows correct nutrition math from profile
- [ ] Carb guardrail warning appears when calculated carbs < 75g
- [ ] Protein switches to lean mass when BF% ≥ 25% (male) or ≥ 35% (female)
- [ ] Step 4 allows adjusting the deficit slider
- [ ] `onboarding_complete = true` written to `user_profiles` on confirm
- [ ] `nutrition_targets` row written with today's `effective_date`
- [ ] `decision_logs` entry created for onboarding completion (`decision_type = nutrition_targets_set`, `status = applied`)

### Weigh-in
- [ ] Can log a weigh-in with just weight in lbs
- [ ] 185 lbs stored as 83.91 kg; retrieved and displayed as 185.0 lbs
- [ ] Dashboard `WeightCard` shows latest weigh-in in lbs
- [ ] `WeightCard` shows next weigh-in date for weekly/Friday cadence
- [ ] `WeightCard` shows trend confidence badge
- [ ] TrendConfidence = `none` with 0 entries, `low` with 1, `medium` with 2–3, `high` with 4+
- [ ] Cannot log two weigh-ins on the same date (unique constraint via upsert)
- [ ] History list shows all entries, newest first, with ± change
- [ ] Delete a weigh-in → list refreshes

### Nutrition
- [ ] `calculateNutritionTargets()` for sedentary 185lb user:
  - Maintenance = 185 × 10 = 1,850
  - Deficit = 450 → Calories = 1,400
  - Protein = 185g
  - Fat = 55.5g → rounds to 56g
  - Carbs = (1,400 - 185×4 - 56×9) ÷ 4 = (1,400 - 740 - 504) ÷ 4 = 156 ÷ 4 = 39g → **low-carb warning fires** ✓
- [ ] Male user at 25% BF, 185 lbs: lean mass = 139 lbs → protein basis switches to lean mass
- [ ] Female user at 35% BF, 185 lbs: lean mass = 120 lbs → protein basis switches to lean mass
- [ ] Unknown/other sex at any BF%: stays on bodyweight with optional note
- [ ] Carb guardrail warning appears when carbs < 75g (does not block save)
- [ ] User can override all targets on `/nutrition` page
- [ ] Override creates new `nutrition_targets` row with today's `effective_date`
- [ ] Override creates `decision_log` entry (`nutrition_targets_updated`, `status = applied`)
- [ ] `NutritionCard` shows correct current targets
- [ ] `low_carb_warning = true` shown as amber warning on `NutritionCard`

### Fasting
- [ ] Start fast creates a `fasting_logs` row with `started_at = now`, `ended_at = null`
- [ ] Dashboard `FastingCard` shows live elapsed time (updating every second)
- [ ] `FastingTimer` shows current milestone note at ≥12h, ≥16h, ≥18h, ≥24h
- [ ] **DB constraint test:** with an active fast, insert a second row with `ended_at = null` directly in Supabase SQL editor → receives error (unique index)
- [ ] App catches error code `23505` and shows: "You already have an active fast."
- [ ] End fast sets `ended_at = now`, calculates `completed_goal` correctly
- [ ] `duration_minutes` is NOT a column in `fasting_logs` (check schema)
- [ ] App-calculated fasting duration matches actual elapsed time
- [ ] Fasting duration calculated correctly for a 16-hour fast (960 minutes)
- [ ] Manual fast add works with past start/end times
- [ ] Manual add without end time is rejected if there's an active fast
- [ ] Edit/delete work for past fasts
- [ ] Weekly stats (avg duration, completed count) displayed on `/fasting`
- [ ] Milestone education notes use coaching language ("Calories still determine fat loss.")

### Decision log
- [ ] `/decisions` page shows all entries, newest first
- [ ] Pending (status = `suggested`) entries have Accept/Dismiss buttons
- [ ] Accept → sets `status = accepted`, `applied_at = now`
- [ ] Dismiss → sets `status = dismissed`
- [ ] Filter tabs work: All / Pending / Applied / Accepted / Dismissed
- [ ] Dashboard `CoachAlertsCard` shows pending decisions
- [ ] Dashboard `DecisionLogCard` shows the most recent entry
- [ ] Changing step goal in Profile → decision log entry created
- [ ] Changing weigh-in cadence in Profile → decision log entry created
- [ ] Changing fasting goal in Profile → decision log entry created
- [ ] Manually editing nutrition targets → decision log entry created

### RLS / Security
- [ ] Direct Supabase anon API call with no auth token → returns empty array (not an error, no data leaked)
- [ ] User A's rows are invisible when logged in as user B
- [ ] All PROTECTED_ROUTES redirect to /login when unauthenticated (verify all 7 routes)

### Data model — Phase 2C readiness
- [ ] `fasting_logs` has no `duration_minutes` column (confirm in schema)
- [ ] No food logging tables exist yet (no `food_items`, `food_logs`, etc.)
- [ ] No existing table design blocks adding `food_item_id` FK to a future food log table
- [ ] `nutrition_targets` `notes` field has no assumptions about food logging format

### No daily weigh-in pressure
- [ ] Scan the entire app: no "Log today's weight" prompt, no daily weigh-in reminder
- [ ] No text suggests users should weigh in daily
- [ ] Dashboard shows schedule (weekly/biweekly/manual) without pressure
- [ ] Onboarding Step 3 contains the approved framing language verbatim

---

## Known limitations (Phase 1A)

- **No React Query provider** — hooks are defined but not wired to a `QueryClientProvider`. The dashboard and most pages use server components with `server.ts` fetches instead. To use hooks in client components, wrap `src/app/layout.tsx` with a `QueryClientProvider`.
- **No food logging** — `NutritionCard` shows targets only. Progress bars are static placeholders.
- **No step logging** — `StepsCard` shows goal only. Manual entry and wearable sync are deferred.
- **No automated coaching logic** — `CoachAlertsCard` shows any `suggested` decisions but the system does not yet auto-generate recommendations from trend data. Decisions are generated manually on profile changes.
- **No chart/trend visualization** — weight trend is text-only. Charts arrive in Phase 2A.
- **BMI disclaimer is not shown** alongside BMI on all surfaces — add where BMI is displayed.

---

## Buddy tester script (Phase 1T)

For testers on the live deployment. Work through in order.

- [ ] Visit the live URL → redirects to `/login`
- [ ] Create an account (password sign-up recommended over magic link —
      Supabase's default email sender has low rate limits)
- [ ] Confirm the "check your email to confirm" message appears
- [ ] Confirm your email → click the link → land in onboarding (or
      note if anything looks skipped/broken)
- [ ] Complete onboarding → land on the dashboard
- [ ] Sign out, then sign back in with password → confirm this also
      routes correctly (not just the magic-link path)
- [ ] Log a weigh-in → check the 28-day summary and history; optionally
      try the waist field
- [ ] Log food manually, try a saved meal, Quick Add, Recent foods, the
      Quick drink log, and the nutrition label calculator
- [ ] Start a workout, log some sets, try a saved routine
- [ ] Log fasting: start a fast, watch the timer and projected end
      time, end it, try the manual past-fast entry
- [ ] Log steps (activity)
- [ ] Visit weekly check-in, progress, coach actions (try recording a
      decision), and decisions (try accepting/dismissing)
- [ ] Try the nav — sidebar on desktop, drawer on mobile — confirm
      every item works and highlights correctly
- [ ] Try it on an actual phone, not just a resized desktop browser

## Owner live QA checks (Phase 1U)

Do these in addition to the Buddy tester script above before relying on
buddy feedback. Use one browser session for your real account and a
separate private/incognito window for a fresh test account, so neither
session affects the other.

### Onboarding gate (highest priority)
- [ ] Sign up a fresh account with password (not magic link)
- [ ] Confirm the email, click the link, note exactly where you land
- [ ] Sign out, then sign back in with that same account's password
      directly — before completing onboarding if possible — and confirm
      you're routed to onboarding rather than a broken/incomplete
      dashboard

### Root redirect + session state
- [ ] Fully signed out, visit `/` → confirm redirect to `/login`
- [ ] Signed in, visit `/` → confirm redirect to `/dashboard`
- [ ] Signed in, visit `/login` directly → confirm it bounces to
      `/dashboard` rather than showing the login form

### Data isolation (verify directly, don't assume)
- [ ] In the Supabase dashboard, confirm RLS is enabled on `food_logs`,
      `workout_sessions`, `saved_meals`, and `daily_activity_logs` —
      not just the Phase 1A tables
- [ ] As the fresh test account, log a weigh-in, a food entry, and a
      workout — confirm none of your real account's historical data
      appears anywhere (dashboard, history lists, progress, recent
      foods)

## Tester feedback template

- **Device/browser:** (e.g. iPhone 14, Safari / Windows, Chrome)
- **Account flow tested:** (e.g. fresh signup, existing login, magic link)
- **Page/feature:** (e.g. /food — Quick drink log)
- **What happened:**
- **What you expected instead:**
- **Screenshot or screen recording:** (attach if possible)
- **Severity:** blocks me from testing / annoying but workable / cosmetic

## Known issues for testers

- UI is intentionally plain — a visual redesign is planned (see Roadmap
  below)
- The login page logo is a temporary placeholder
- This is test data — expect resets; please don't log real personal
  health information you'd want to keep
- If a confirmation or magic-link email is slow to arrive, try password
  sign-up/sign-in instead

## Privacy & data notes

- This is a private, invite-only deployment, not a public service
- Test accounts and the developer's own account share one Supabase
  project; RLS plus consistent per-user scoping in every server query
  keep data separated
- Please don't log sensitive personal information you wouldn't want
  reset or seen during testing

## Watch list before wider testing (Phase 1U)

- **Password sign-in onboarding routing — resolved in Phase 1V.**
  Live Safari Private Browsing testing traced this to client-side App
  Router navigation into `/dashboard` colliding with Safari's stricter
  `history.replaceState` rate limit after auth/onboarding state
  changes — not a missing onboarding check. Fixed by switching both
  the onboarding-completion and password-sign-in success navigations
  to `window.location.assign('/dashboard')` (a full document
  navigation), in `OnboardingWizard.tsx` and `login/page.tsx`. See
  `phase1v-auth-onboarding-navigation-stable`.
- **RLS coverage for post-Phase-1A tables** — `food_logs`,
  `saved_meals`, `workout_sessions`, `workout_exercises`,
  `workout_sets`, `workout_routines`, and `daily_activity_logs` have no
  documented RLS status in this README. Needs a direct check in the
  Supabase dashboard.
- **README needs a full documentation refresh** — the Phase 1A-era
  sections (file tree, RLS summary, deferred features, testing
  checklist) are stale relative to the app's actual current state.
  Deferred until after buddy testing settles.
- **ForgeFit visual system / modular Home widgets** — already captured
  in the Roadmap section below. Not part of this phase.

## Roadmap — Phase 2E / Phase UI-1: ForgeFit visual system + modular dashboard

Status: planned, not started. Build only after buddy testing confirms
core flows work. This is a full design-system phase (components,
layout rules, spacing, tokens, mobile-first behavior) — not a cosmetic
CSS-only patch.

### 1. Naming / brand direction
- Evaluate renaming the public-facing app from ShredOS to ForgeFit
- ShredOS remains the internal/build codename until a decision is made
- Preferred direction: ForgeFit feels more inclusive and polished than
  "shred/get shredded"
- Explore: ForgeFit, ForgeFit OS, ForgeFit Coach, ForgeFit Training

### 2. Logo direction
- Target: the supplied ForgeFit "F" mark, mint/green gradient
- Replaces the temporary standalone "S" on the login page
- Future scope: app icon, favicon, splash/social preview, in-app logo
  usage

### 3. UI design direction — north star
- Dark charcoal/black glass background
- Mint/green gradient accents
- Rounded modular cards, premium fitness dashboard feel
- Clean mobile-first bottom navigation
- Soft glows, subtle borders, high-contrast typography
- Widget-like data cards, not plain bordered boxes

### 4. Modular/customizable Home dashboard
- Users choose which widgets appear on Home
- Users can reorder widgets
- Widget size/layout options: full-width, half-width, compact,
  hidden/off
- Workout-only users can show just workout widgets; full-app users can
  include workout, nutrition, weight trend, steps/activity, fasting,
  progress, coach insights, weekly streak/consistency, and (later)
  upcoming run/cardio
- Goal: avoid feature noise by making Home opt-in per widget rather
  than forcing every feature on every user
