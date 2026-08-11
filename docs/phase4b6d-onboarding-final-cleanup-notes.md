# Phase 4B.6D — Onboarding Redesign + Final Active-Route Legacy Cleanup Notes

Companion to the 4A audit and 4B.1–4B.6C notes. Final subphase of the approved 4B.6 split: the onboarding experience moves onto the ForgeFitOS design system and the last active `.shred-card` consumption is removed. **Presentation only**: every onboarding behavior — step state, field semantics, validation gates, option values, nutrition math, the profile / nutrition-target / decision-log write contract, error handling, and the completion redirect — is byte-anchored unchanged by the 4B.6D harness. This is not a feature phase: historical/manual workout import, Apple Health / Apple Watch synchronization, manual workout calorie entry, manual duration correction, import exercise matching, and automatic name normalization are all explicitly deferred to a later functional phase.

## Audit inventory (against e1f3556)

Active `.shred-card` consumers found: `OnboardingWizard.tsx` (step panel wrapper) and `Step4Nutrition.tsx` (macro tiles) — exactly the historical inventory. Non-consumers: the `globals.css` alias definition (deliberate 4B.1 compatibility contract, retained) and a comment in `ui/card.tsx` (allowed). Onboarding additionally carried visibly broken legacy tokens under `html.dark` (the IACVT class from 4B.1): invisible upcoming progress segments (`bg-secondary`), a non-red submit error (`text-destructive`), low-contrast amber warnings on the light canvas, low-contrast decorative macro-tile palette (blue/yellow/orange-400), and a route-level `min-h-screen bg-background` wrapper predating the pinned shell.

## Scope (5 feature/source files — under the 18-file stop rule)

Modified: `OnboardingWizard.tsx`, `Step1Bio.tsx`, `Step2Goals.tsx`, `Step3Schedule.tsx`, `Step4Nutrition.tsx`. The route page (`onboarding/page.tsx`) needed no change (thin server gate, correct metadata). **No loading file was added**: the route's only server work is the auth/onboarding-complete gate, the wizard is a client island with no mount-time fetch, and there is no visible bare-loading defect — adding one would be scope inflation.

## Wizard treatment

Route container follows the app pattern (`mx-auto max-w-lg space-y-6 p-4 lg:p-6`) — the old `min-h-screen bg-background` wrapper is gone; onboarding lives inside the viewport-pinned shell and scrolls within `main` like every route. Header: the existing single H1 (`Set up your profile`) plus the textual step context `Step X of 4 — {label}`; labels are now `Personal details / Goals / Schedule / Nutrition` (approved copy; only 'Bio' was renamed). Progress segments are decorative (`aria-hidden`; the text line is the accessible state): completed `bg-brand`, current `bg-brand-active`, upcoming `bg-surface-sunken` — never color-only, no percentage, no step jumping, no gamification. The step content renders in **one coherent `elevated` Card**; the submit error is a `critical`-token row directly below the panel. One QA-correctness fix: step changes previously called `window.scrollTo(0, 0)`, which became a no-op when 4B.6C pinned the shell (the window no longer scrolls) — the wizard now scrolls its own container into view inside `main`, restoring the intended return-to-top behavior. `handleComplete` is byte-identical: upsert `user_profiles` (incl. `onboarding_complete: true`) → conditional `nutrition_targets` upsert → `decision_logs` insert → `window.location.assign('/dashboard')`; no autosave, no per-step persistence, no new writes.

## Step treatments

**Step 1 (Personal details):** all fields, bounds, and the `canProceed` gate (name + current weight) unchanged; local Input/Select/Label primitives moved to semantic ink tokens with the app-wide input chrome (matching the profile page); required asterisks remain only on the two actually-required fields; goal weight and both body-fat fields are now explicitly "(optional)" — body-fat entry was never mandatory and no longer reads as if it might be. Units stay adjacent. **Step 2 (Goals):** all six goal values, three experience values, three activity values, OptionCard/OptionCardCompact semantics, the step slider, and the multiplier copy are unchanged; only ink/brand token swaps. Goal wording remains neutral; selecting a goal still only writes local form state. **Step 3 (Schedule):** every cadence/day/time/fasting/dietary option and conditional is unchanged; the weigh-in tip moves to a valid `bg-brand-subtle` row; the fasting switch adopts the profile page's toggle chrome (`bg-brand` / `bg-surface-sunken border-edge`); the three dropdowns keep the shared 4B.6C-corrected Select primitive (opaque `bg-surface`, `z-[200]` portal) with no local overrides. **Step 4 (Nutrition):** calculation call, deficit slider (200–700, default from `DEFAULT_DEFICIT`, fat-loss/recomposition-only), guardrail warnings, no-weight branch, and the completion handoff are byte-identical; the `.shred-card` macro tiles become the `/nutrition` sunken-tile pattern (`bg-surface-sunken` + `metric-label`), calories keep brand emphasis while protein/carbs/fat read as plain-ink facts (the low-contrast blue/yellow/orange palette is gone); warnings move from amber-alpha to `caution` tokens. Values read as factual setup numbers — no advice framing added or removed.

## Final legacy cleanup — audit results for the candidate list

- **FoodLogEntry** — D: legacy ink tokens render acceptably inside migrated MealSection cards; behavior-heavy edit/delete rows; no visible defect; deferred.
- **AddFoodForm** — D: required-indicator contract already corrected in 4B.6C; remaining chrome matches the app-wide input convention; deferred.
- **SavedMealForm** — D: same input convention, renders inside the 4B.6C elevated create Card; deferred.
- **SetRow** — D (explicitly untouched): highest-risk behavior surface; no overflow, contrast, target, or surface defect observed; every tracking mode byte-anchored by the 4B.6B harness.
- **ExerciseHistoryRows** — D: two legacy ink tokens, visually subordinate and readable; deferred.
- **ActiveWorkoutConflictModal** — C/D: the dialog panel is deliberately hard-opaque (`!bg-white` + inline hex) — a prior fix for the same transparent-token class the Select suffered; dialog semantics, three choices, and API behavior intact; not visibly broken; deferred rather than churned.
- **ExerciseForm** — D: pill + input chrome legacy but unambiguous (selection carries border/weight, not color alone); no visible defect; deferred.
- **RoutineForm** — D: PillGroup selected state is monochrome but unambiguous (Check icon + `border-2` + `font-semibold` + `aria-pressed`); inputs on the app-wide convention; deferred.
- **CreateWorkoutButton** — clean: no legacy tokens; untouched.
- **StartWorkoutButton** — D: one subordinate legacy hint row (`bg-secondary`, renders transparent-on-canvas, readable); deferred.

## Legacy token classification (delivery contract)

- **A. compatibility only** — the `.shred-card` alias and `.metric-label` utility in `globals.css` (still consumed by `/nutrition` and now Step 4's tiles); the legacy shadcn token definitions in `globals.css` that back deferred chrome.
- **B. inactive/dead code** — `fetchProgressSummary` in `src/lib/progress-summary.ts` (zero call sites; untouched, per standing instruction).
- **C. intentional domain-state styling** — `ActiveWorkoutConflictModal`'s hard-opaque white dialog surface; lib-computed food progress/remaining colors.
- **D. future cleanup, no visible defect** — the deferred component list above, plus the app-wide legacy input chrome (`bg-secondary border-input`, renders consistently everywhere including profile and onboarding) and the shared OptionCard/OptionPill primitives (`border-primary bg-primary/20` selected state — valid mint values, QA-accepted on profile).

There is no unexplained active broken legacy styling: everything visibly broken that remained (onboarding progress segments, submit error, amber warnings, tile palette, wizard wrapper) was fixed in this phase.

## Shell + Select invariants (unchanged, re-pinned)

The physically proven 4B.6C architecture is untouched and re-pinned by the 6D harness: authenticated shell `fixed inset-0 flex overflow-hidden bg-canvas` (out of document flow, no viewport-height sizing), `main` the sole app-content scroller with bottom-nav clearance, sidebar nav independently scrollable, unsized body, no html/body overflow lock, no JS viewport sizing. The shared Select keeps its opaque semantic menu (`bg-surface text-ink border-edge shadow-lg z-[200]`, portal, sunken item highlight); onboarding consumes it without local overrides.

## Prior-harness retargets (5, all retired pre-migration markers — never behavior)

1. `verify-phase4b6c.ts` — "remaining occurrences are onboarding-only" → zero active consumers remain.
2. `verify-phase4b6c.ts` — "Onboarding untouched (pre-migration markers intact)" → onboarding behavior anchors (`onboarding_complete: true`, `calculateNutritionTargets`).
3. `verify-phase4b5.ts` — alias-consumer example → alias retained + wizard behavior anchor.
4. `verify-phase4b6a.ts` — "onboarding untouched (4B.6D scope)" → behavior anchor.
5. `verify-phase4b6b.ts` — "Onboarding untouched" → behavior anchor.

## Behavioral preservation

No changes to: onboarding persistence, step state, required/optional semantics, profile field semantics, profile creation, Supabase behavior, auth, redirects, step validation, nutrition/goal calculation, units/conversions, option values, defaults, write timing, or server/client boundaries. Migrations remain 13. No dependencies, no routes, no shell or navigation changes.
