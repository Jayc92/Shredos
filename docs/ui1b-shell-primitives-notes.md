# UI-1B — Shared Shell and Core Presentation Primitives Notes

Second UI-overhaul slice, from checkpoint `8e0f1a2` / `ui1a-dark-foundation-stable`. Two deliverables: the FORGEFIT shell presentation, and the six domain-blind presentation primitives the UI-2/UI-4 redesigns will compose. **No route recomposition, no behavior change, no data change, no migration (exactly 001–019).**

## Investigation findings

The 4B.2 shell was already structurally strong (grouped sidebar from the single `route-match.ts` model, five-pillar bottom nav, Radix More sheet, 44px+ targets, safe areas, non-color active cues, `<main>` sole scroll owner) — so shell work is deliberately *polish*, not rebuild. Pin audit before editing: TopBar's exact header classes are pinned twice (verify-phase4b2:374/376, verify-phase4b6c:783) → **TopBar untouched**; MoreSheet already conforms → **untouched**; sidebar header height, group-label styling, and bottom-nav active color are unpinned → safe to refine; the 4b1 wordmark pins are aria-label-based (`aria-label="ForgeFitOS"`), so the visible FORGEFIT text requires **no retarget**; StepsCard's 4b3 pins are copy/expression-level and survive adoption.

## BrandMark (extended, not replaced)

`BrandMark` (mark-only) is unchanged — same modular-F geometry, same tokens, same decorative/labeled API. `BrandWordmark` now renders the approved **FORGEFIT** lockup ("FORGE" in ink + "FIT" in mint, uppercase, letter-spaced) with a new `size: 'default' | 'compact'` variation; the wordmark text is `aria-hidden` and the lockup carries `aria-label="ForgeFitOS"` — the accessible name, metadata, `APP_NAME`, package name, repo, routes, and env identifiers are all unchanged (pinned). No raster assets, no avatar, no online indicator.

## Shell polish (visual-only)

**Sidebar:** header `h-12 → h-14` (wordmark presence), group labels tightened to `text-[10px] font-semibold tracking-[0.14em]`, spacing rhythm `py-2 → py-3`/`pb-2`, active item's icon now carries the mint accent (additive — bar + tint + weight + `aria-current` remain the non-color cues), `active:bg-surface-sunken` pressed states on nav links and Sign out. Width stays `w-56`; groups, destinations, matching, fasting gate, and the sign-out form are byte-identical.
**MobileBottomNav:** active pillar color `text-brand-active → text-brand` (the darker press shade read muddy on the dark shell; bright mint matches the concepts). Bar/stroke-weight/font-weight/`aria-current` cues, `min-h-14` targets, `grid-cols-5`, safe-area padding, and `lg:hidden` all unchanged. At 320px each slot is 64px wide with `text-[11px]` labels — no overflow.
**TopBar / MoreSheet:** untouched (pinned exact / already conformant).

## Primitives (src/components/ui/, all server components, all token+role-class based)

| Primitive | API | Edge behavior |
|---|---|---|
| `PageHeader` | title, eyebrow?, description?, action?, `as: 'h1'\|'h2'` (default h1) | flex-wrap responsive stacking; caller owns heading level; renders only caller copy |
| `SectionHeader` | title, description?, action?, `as: 'h2'\|'h3'\|'h4'`, `spacing: normal\|compact` | baseline-aligned action slot |
| `MetricValue` | value, unit?, label?, trend?, `size` | tabular numerals (`font-stat`); **no** formatting/classification — callers pass finished strings |
| `ProgressBar` | `value: number\|null\|undefined`, `max` (default 100), required `label`, `size sm/md/lg` | null/NaN/invalid-max → `data-state="unavailable"`, dimmed track, **no** `aria-valuenow` (never reads as zero); zero is valid (valuenow 0); render clamps 0–100% but `aria-valuetext` always announces the true value; `value > max` → `data-state="over"` at full width |
| `ProgressRing` | same value contract + `size`/`strokeWidth` px | static server SVG (no client JS, no animation — reduced-motion safe by construction); unavailable = dashed track + "not available" label; zero = solid track, no arc; over = full arc + `data-state="over"` with the true value announced (`role="img"` + `<title>`) |
| `EmptyState` | icon?, title, description?, action?, `mode standard\|compact` | renders exactly caller copy (runtime-pinned); compact reproduces the app's inline muted-paragraph convention byte-for-byte; standard = centered icon→title→description→action block |

`StatRow` was **not** created: the audit's 51 stat-row duplicates are two-cell flex rows that UI-2 may express with plain layout; no repository evidence requires a primitive before then.

## Limited adoption (proving integration without recomposition)

1. Shell: `BrandWordmark` FORGEFIT lockup in the sidebar (TopBar keeps mark-only per its pins).
2. `StepsCard`: the hand-built `h-1.5` sunken-track bar → `<ProgressBar size="sm">` — identical geometry (sm = h-1.5, same track token; the fill's `bg-primary → bg-brand` is the same computed color since UI-1A aligned them), with the presentational pct clamp moving into the primitive (StepsCard passes raw `steps`/`stepGoal`; domain math `remaining`/`goalMet` untouched).
3. `StepsCard`: the inline empty block → `<EmptyState mode="compact">` with byte-identical copy and markup.
PageHeader / SectionHeader / MetricValue / ProgressRing have **no** safe non-recomposing consumer yet — exported and runtime-harness-tested for UI-2, per instruction.

## Verification

`verify-ui1b` (84 checks) covers the required 30 items, with the progress primitives' zero/partial/complete/over/unavailable semantics proven at **runtime** by invoking the component functions and walking their element trees (the classic-JSX React global is provided before dynamic import — a reusable pattern for future component harnesses).

## Retargets (1)

- `verify-phase5a4` "StepsCard: goal math unchanged": the pin included the presentational `pct` clamp expression verbatim. That clamp moved into the domain-blind ProgressBar (runtime-proven in verify-ui1b S18c/S18d); the DOMAIN math the check protects — `remaining` and `goalMet` — is unchanged and still pinned verbatim, and the retarget additionally pins that the bar receives raw `value={steps} max={stepGoal}`. No other suite needed changes (zero shell retargets).

## Files changed

Modified: `BrandMark.tsx` · `Sidebar.tsx` · `MobileBottomNav.tsx` · `StepsCard.tsx` · `scripts/verify-phase5a4.ts` (retarget). New: `ui/page-header.tsx` · `ui/section-header.tsx` · `ui/metric-value.tsx` · `ui/progress-bar.tsx` · `ui/progress-ring.tsx` · `ui/empty-state.tsx` · `scripts/verify-ui1b.ts` · this document.
