# UI-3 — Durable Today Widget Customization Notes

From checkpoint `78febb6` / `ui2-today-dashboard-stable`. Adds server-stored, owner-only dashboard preferences: every one of the ten Today widgets can be enabled/disabled, reordered, and sized, with the UI-2 composition preserved as the canonical default. **Migration 020 is the single schema change and must be applied by Joseph/ChatGPT to the ShredOS project only — this repo turn performed no Supabase operation.**

## Schema and security audit

`user_profiles` carries complete owner-only RLS from migration 001 (`profile_select/insert/update/delete`, all `user_id = auth.uid()`, UPDATE with USING + WITH CHECK) and the shared `updated_at` trigger. **A new column inherits all of it — no policy is added or changed** (adding one would duplicate 001). No service-role client exists anywhere in the codebase and none was introduced. There are no server actions in this architecture; the persistence convention is route handlers with the authenticated server client (`auth.getUser()` → 401 → RLS-scoped write additionally pinned by `.eq('user_id', user.id)`), and UI-3 follows it exactly. JSONB convention (`dietary_prefs`/`allergies`) is `NOT NULL DEFAULT` — followed.

## Migration 020 (`supabase/migrations/020_ui3_dashboard_preferences.sql`)

`ALTER TABLE user_profiles ADD COLUMN dashboard_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;` plus a column comment describing the V1 document and `NOTIFY pgrst`. Safe for existing users (additive; every row gains `'{}'`, which normalizes to the canonical defaults — no backfill, no rewrite, no policy, no new table). The exact SQL ships in the delivery report for hosted application.

## Preference contract (V1)

`{ version: 1, widgets: [{ id, enabled, size }] }` — **array order is display order** (no redundant numeric field). Ten canonical ids: calories, protein, steps, weight, nutrition, workout, energy, fasting, coach, decisions — all independently disableable, **including Coach** (approved). Canonical default = the UI-2 composition flattened into the preference grid: three compact tiles, full-width weight, half-width everything else, all enabled. `DEFAULT_DASHBOARD_PREFS` is the single exported source of truth (frozen).

**Size support:** full/half/compact for everything except `weight` (half/full — the readings chart needs room) and `energy` (half/full — evidence quality, complete-day counts, target context, and the no-eat-back framing must never compress into a third of the row). Unsupported sizes are absent from the editor by contract, and normalization repairs them if stored.

**Desktop spans:** full=12, half=6, compact=4 columns; sm tier: full spans both columns, half/compact take one; below 640px every widget is a full row. The default fills every 12-column row exactly (4+4+4 / 12 / 6+6 / 6+6 / 6+6 — runtime-pinned).

## Normalization (one pure function, both directions)

`normalizeDashboardPrefs(unknown)` guards reads AND writes: null/missing/scalar/array/`'{}'`/unsupported-version → canonical defaults; unknown ids ignored; duplicates keep the first occurrence; `enabled` must be a real boolean; `size` must be in the enum **and** supported by that widget; valid user order preserved; missing canonical widgets restored with defaults appended in canonical order (future-widget recovery — runtime-pinned); never mutates input; never throws; deterministic. The server route re-normalizes the browser payload regardless of what the client sent.

## Persistence path

`PUT /api/dashboard-prefs`: authenticated server client → `auth.getUser()` (user id **only** from the session) → explicit 400 for unreadable JSON (never a silent reset) → `normalizeDashboardPrefs(body)` → single-column `.update({ dashboard_prefs })` scoped by RLS + `.eq('user_id', user.id)` → 500 with a clear message on failure → `revalidatePath('/dashboard')` on success. No other profile field is touched; no optimistic success.

## Customize experience (`/dashboard/customize`)

Server page (standard auth + profile read + normalize) → client editor. Per-widget rows: **move up/down buttons** (the chosen reorder interaction — option 1 from the required evaluation: identical behavior for keyboard, screen reader, touch, and mouse, zero dependency, and no fake drag affordance — nothing in the UI suggests dragging because nothing drags), visible "Position N of 10", show/hide Switch, Full/Half/Compact segmented buttons (`aria-pressed` + border + weight — never color alone), 44px+ targets throughout. **Save is the only persistence path**; Cancel is a plain link; **Reset to default is local draft state until Save**. A failed save keeps the editor open with the draft intact and a retryable `role="alert"` error. Fasting row: the preference stays editable, with an explanation that the widget remains hidden while profile fasting is off. **Unsaved-changes interception:** deliberately not implemented — no global navigation interception exists in this architecture and fragile `beforeunload` work was declined; Cancel is explicit and the header states changes apply on Save (documented limitation).

## Today rendering

The page normalizes `profile.dashboard_prefs`, applies the capability gate (`visibleDashboardWidgets` — the fasting preference can hide but **never reveal** when `profile.fasting_enabled` is false), and maps visible widgets over a literal per-id registry into one `grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 items-start` grid with spans from `dashboardSpanClasses`. Every widget keeps its exact UI-2 props/behavior; each id mounts exactly once. The page header and workout hero are **page chrome, not widgets** — the hero shows only workout information, so the approved workout-only layout (only `workout` enabled) exposes nothing from hidden widgets (runtime-pinned). All-disabled is valid: Today renders a purposeful empty state ("Your dashboard is empty… your data is still being tracked") with a prominent Edit layout action, so lock-out is impossible; the header also always carries Edit layout.

**Query behavior (deliberate):** all 23 bounded reads still run regardless of visibility. Skipping reads for disabled widgets would fork the shared summary pipelines (coach/nutrition/energy reuse each other's fetched inputs) for marginal savings and real regression risk — deferred until evidence shows it matters.

**Loading:** the skeleton is now a stable generic approximation of the canonical default (it cannot know the personalized layout) — documented in-file; aria-hidden; reduced-motion safe.

## Failure matrix

no stored prefs / `'{}'` → defaults · malformed JSON → defaults (never a blank Today) · old/unsupported version → defaults · all disabled → recovery state · profile read failure → existing redirect path (unchanged) · save failure → editor keeps draft + retryable error · fasting capability off → widget gated regardless of preference, editor explains · future widget missing from stored V1 → restored enabled at default size · unknown id in storage → ignored · duplicate ids → first wins.

## Retargets (this phase)

- **Migration-count pins (7 suites):** 5b2, 5b3, 5b4, 5b5, ui1a, ui1b, ui2 — "no 020" was the standing boundary while 020 was unapproved; each retargets to "exactly 20, and the single addition is the named UI-3 file" (the no-UNEXPECTED-migration boundary survives).
- **verify-ui2 (15):** branch-duplication id counts → strictly-stronger exactly-once registry counts; "no persistence"/"no Edit Layout" → superseded by design (now pinned to the normalized server path and the functional control); grid/span/order/loading pins → the size-contract equivalents, with occupancy and default order proven at runtime through the real helpers; C12's fasting-off order note: decisions no longer repositions (deliberate simplification, documented).
- **verify-phase4b3 (15):** fasting-conditional string pins → the single `visibleDashboardWidgets` pipeline gate (hide-only, stronger); DOM-order anchors → registry anchors; unconditional-mounting → all-ten-in-registry; skeleton pins → generic-skeleton equivalents; content-start rail pin → grid items-start.
- **verify-phase5b3 (3 + migration):** energy-region pins → the size contract (energy can never be compact — the defect row is impossible by construction); fasting-condition pin → the pipeline gate.
No Phase-5 energy/nutrition/target/evidence/Coach expectation was touched; no assertion count fell.

## Hosted QA protocol

Apply migration 020 first (Joseph/ChatGPT, ShredOS project only). Then: default layout renders identically to accepted UI-2; Edit layout → reorder/resize/hide round-trips; workout-only and all-disabled layouts; fasting preference vs capability; save-failure behavior; both 320px and desktop widths; Cancel/Reset semantics.
