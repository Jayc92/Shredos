# UI-1A — Dark Foundation and Legacy Compatibility Notes

First implementation slice of the ForgeFitOS UI overhaul, from checkpoint `4311d9f` / `phase5b5-progress-energy-stable`. Values-only theme work: the token layer converts to the approved dark navy/charcoal system, the broken legacy compatibility layer is repaired, pinch zoom is restored, and the three audited legacy islands adopt semantic tokens. **No composition, behavior, data, route, or component-boundary change anywhere.** Dark is the only theme (approved decision) — no toggle, no persistence mechanism.

## Root problem being fixed

The documented THEME REALITY (4B.1): every legacy shadcn token was an `oklch()` value consumed through `hsl(var(--token))` in tailwind.config.ts — invalid CSS — so `bg-card`, `bg-background`, `text-foreground`, `border-border` and friends never resolved, and the app rendered light despite `html.dark`. 4B.1 deliberately pinned a *light-first* valid token set and architected the dark theme as a later values-only swap of the same token names. UI-1A executes exactly that swap.

## Token contract (after)

All values are valid HSL triplets; names unchanged; consumers untouched.

- **Surfaces (deep navy, never pure black; strictly ordered):** sunken `221 26% 5%` < canvas `220 25% 7%` < canvas-subtle `220 22% 9%` < surface `220 20% 11%` < raised `219 19% 14%` ≤ interactive `220 18% 15%`; selected `165 28% 14%` (brand-tinted). Elevation = surface contrast + hairline edge + deepened shadow (raised `0.35/0.30`, floating `0.40/0.45` alphas); the standing no-neon-glow / no-glassmorphism policy is unchanged and pinned.
- **Text:** primary `210 25% 96%`, secondary `214 15% 76%`, muted `215 12% 62%`, inverse `222 30% 10%`.
- **Edges:** subtle `219 16% 20%` < default `218 14% 27%` < strong `217 12% 40%` — all above surface lightness (visible hairlines).
- **Brand:** mint `163 62% 52%`; hover **lightens** (`163 66% 60%`) — the inverse of the light theme's darken; active `163 60% 46%`; subtle `165 45% 16%`; on-brand foreground `168 60% 8%`.
- **States (brightened for dark):** success `142 55% 55%`, caution `38 90% 58%`, critical `0 80% 66%`, info `252 85% 74%`, each with a dark `-subtle` tint (L 14–17) that still yields ≥4.5:1 with its state color. Focus ring `163 80% 55%`. Readiness aligns with states.
- **Charts:** all six series lifted to L ≥ 52 so lines, dashed targets, and labels read on dark surfaces. The two server-SVG charts (ExerciseTrendChart, WeeklyEnergyChart) consume `stroke-primary` / `stroke-border` / `fill-muted-foreground` — all repaired by the token swap; no chart component was edited.
- **Legacy compatibility mapping:** `--background`=canvas, `--foreground`=text-primary, `--card`=surface, `--popover`=raised, `--primary`/`--ring`=brand, `--secondary`/`--muted`/`--accent`=interactive band, `--muted-foreground`=text-muted, `--destructive`=critical, `--border`=edge-subtle, `--input` `218 14% 25%`. Both the legacy `:root` block and the winning `.dark` block carry the same triplets (deterministic under any class state). The unused `.light` block is intentionally untouched (no toggle exists to reach it; not dead-code cleanup scope).
- `color-scheme: dark` — native controls, scrollbars, autofill, number/date pickers render dark.

## Contrast (computed in verify-ui1a, WCAG AA)

primary/canvas 17.33 · primary/surface 15.88 · secondary/surface 9.53 · muted/surface 6.28 · muted/canvas 6.85 · brand-foreground/brand 8.70 · focus-ring/canvas 12.06 (≥3 non-text) · critical/critical-subtle 5.13 · success/success-subtle 6.74 · caution/caution-subtle 7.34 · info/info-subtle 5.41 · brand/canvas 9.76 (≥3) · primary/raised 14.62 · secondary/interactive 8.53. Thresholds live in the harness; a failing pair fails the build — tokens get adjusted, not tests.

## Viewport accessibility

`maximumScale: 1` and `userScalable: false` removed (WCAG 1.4.4 restoration, approved). `themeColor` now `#0d1016` (= dark canvas). Nothing else in the viewport/metadata changed.

## Legacy islands repaired (the only component-file edits)

1. **login** — legacy utilities → semantic tokens (`bg-canvas`, `bg-surface-interactive`/`border-edge` inputs, `bg-surface-sunken` tab track with `bg-surface-raised` active tab, `bg-brand`/`hover:bg-brand-hover` buttons, `focus:ring-focus-ring`); the raw `green-500/400` success box → `bg-success-subtle`/`text-success`; error text → `text-critical bg-critical-subtle`. All three auth flows (password/signup/magic link), handlers, and redirects byte-identical.
2. **ExerciseForm** — same utility swap on inputs, pills, dividers, checkbox, and cancel button. Tracking-mode logic, muscle-role prefill, and the 5A.6B disclosures untouched.
3. **profile NumField** — the raw input adopts the same semantic input classes. Unit round-trip logic untouched. Profile's other inputs and the hand-rolled switch (`bg-white` knob — deliberate thumb contrast that works on dark) are **out of the audited island scope** and now render correctly through the repaired legacy layer anyway; a broader control cleanup belongs to UI-7.

## Retargets (verify-phase4b1 section 13 — each individually flagged in the harness)

The section pinned the corrected *light alias* contract. Each check keeps its original behavioral boundary, re-expressed against dark with equally tight bounds: surface dark (≤16) · canvas dark-not-black (4–10) · canvas/card **agreement** (structure unchanged) · card text readable (primary ≥90, secondary ≥65) · border-subtle a visible hairline (14–34, above surface) · states **brightened** (was darkened) · subtle tints stay **backgrounds** (≤22, was ≥88) · skeleton sunken visible and below surface (2–9) · `color-scheme: dark` (was light). No other suite pinned theme values; no viewport pin existed anywhere.

## What automated validation does NOT prove

Structural and computed checks prove token validity, hierarchy, contrast math, and behavioral preservation. They do **not** prove the theme *looks* right — hosted Vercel physical QA remains the visual acceptance authority (see risks in the delivery report).

## Files changed

`src/app/globals.css` · `src/app/layout.tsx` · `src/app/(auth)/login/page.tsx` · `src/components/workout/ExerciseForm.tsx` · `src/app/(app)/profile/page.tsx` · `scripts/verify-phase4b1.ts` (retargets) · `scripts/verify-ui1a.ts` (new) · this document. No migration (exactly 001–019).
