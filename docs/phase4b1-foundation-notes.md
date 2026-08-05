# Phase 4B.1 — ForgeFitOS Foundation Notes

Companion to `docs/phase4a-ux-information-architecture-audit.md`. Records the transitional aliases, icon rules, and deferred items introduced by the 4B.1 foundation. **Current state** vs **later 4B route redesign** is distinguished throughout: 4B.1 establishes tokens and primitives; routes migrate onto them in 4B.3–4B.6.

## Theme reality (QA correction, root cause)

The legacy shadcn tokens in `globals.css` are **oklch() values consumed
through `hsl(var(--token))`** in `tailwind.config.ts`. `hsl(oklch(…))` is
invalid CSS, so every oklch-backed utility (`bg-background`, `bg-card`,
`border-border`, `text-foreground`, …) is invalid at computed-value time
and falls back (transparent backgrounds, currentColor borders, default
black text). The app has therefore **always rendered light** — white
canvas, black text — despite the hard-applied `html.dark` class; only the
valid HSL triplets under `.dark` (`--primary` mint, `--ring`) ever took
effect. The `dark` class on `<html>` must stay: it is what supplies those
valid mint triplets.

A second layer of the same bug: the root layout put the `bg-background
text-foreground` **utility classes** on `<body>`. As class selectors
(specificity 0,1,0) they beat any element-selector rule, won the cascade
with their invalid values, and left the body **transparent** — so the
page color followed the viewer's OS color scheme (white on light
machines, near-black on dark ones). The correction replaces them with the
valid `bg-canvas text-ink` utilities and pins `color-scheme: light`, plus
an `html body` token-based fallback rule in `globals.css`. Verified live
in a production build: body computes `rgb(255,255,255)` with Geist Sans
regardless of OS scheme. The same invalid-`var()` failure also silently
broke the font stack (see the alias table).

Consequence for 4B.1: the ForgeFitOS tokens are **light-first** so that
not-yet-redesigned routes stay coherent on the real (light) canvas. The
architecture stays dark-capable — a genuine dark theme lands later as a
scoped override of the same token names, with no consumer changes.

## Transitional aliases (temporary — remove as routes migrate)

| Legacy | Now resolves to | Removal plan |
|---|---|---|
| `.shred-card` | **temporary LIGHT legacy compatibility alias**: ForgeFitOS `--surface` (white) / `--border-subtle` (light gray) / `--radius-card` — coherent with the current light canvas | replaced by `<Card variant>` (the future semantic system) intentionally, route-by-route in 4B.3–4B.6; the alias is removed only after route migration completes; do not use in new code |
| `.status-success/-warning/-danger/-info` | semantic `--success/--caution/--critical/--info` tokens | replaced by `Badge`/`Notice` variants |
| `var(--font-sans)` / `var(--font-mono)` in the Tailwind font chains | **removed** (QA correction) — the variables were never defined, and one undefined `var()` invalidates the whole `font-family` declaration, so the app rendered Times instead of Geist | permanent; same invalid-`var()` class of bug as the oklch-in-hsl issue |
| shadcn legacy tokens (`--background`, `--card`, `--primary`, …) | untouched; still power existing utilities (`bg-card`, `text-primary`, …) | remapped per-surface during route redesigns |
| `tailwind` `shred.*` color literals | retained, deprecated | delete after 4B.6 |
| Legacy oklch `--chart-1..5` values | **overridden** by ForgeFitOS multi-hue triplets (no consumers existed in `src/`) | permanent |

`--primary` (mint 162 70% 55%) still backs `text-primary`/`bg-primary` everywhere. De-overloading is **planned per-route**: new code uses `brand` for identity/primary action, `success`/`caution`/`critical`/`info` for state, `focus-ring` for focus. Existing routes keep rendering unchanged until their 4B subphase.

## Icon system

- **One library: `lucide-react`** (already installed; no second library, no emoji anywhere — the seven `⚠️` prefixes and the `⚡` decoration were removed in this phase; the amber styling and text carry the meaning).
- Size conventions: 16px inline (`size-4`), 18–20px controls, 20–24px navigation (`w-5`/`size-6`); larger only for genuine empty-state illustration (none exist yet).
- Consistent stroke: lucide default (2px); don't mix stroke widths.
- Decorative icons: `aria-hidden="true"`. Icon-only controls: `aria-label` required (TopBar menu toggle already complies).
- Status icons supplement text (see `Notice`), never replace it. Trend direction always includes words or numbers.
- **Transitional until 4B.2:** `nav-items.ts` keeps its current 12 flat entries and icons, including the duplicated `UtensilsCrossed` for Food/Nutrition — the grouped-pillar navigation and icon cleanup land in 4B.2 per the 4A brief.

## Intentionally retained non-emoji Unicode

`✓` (U+2713), `×`, `·`, `—`/`–`, `→ ↑ ↓`, `±`, `≥/≤` remain in UI strings — they are typographic/dingbat characters, not `Extended_Pictographic` emoji, and always accompany text. The harness emoji audit uses `\p{Extended_Pictographic}` so these are not falsely flagged.

## New primitives (4B.1)

`Button` gains `primary`/`tertiary` variants, `compact`/`large` sizes (large = 44px touch target), and a width-preserving `loading` state. `Card` gains `variant`: `default | elevated | interactive | selected | metric | action | status | subtle` (`default` renders byte-identically to before). `Badge` gains `neutral | brand | success | caution | critical | info` (plus existing variants). `Input` gains read-only styling and `FieldHelp`/`FieldError` (use with `aria-describedby`). New: `Notice`, `Skeleton`/`SkeletonText`/`SkeletonMetric`/`SkeletonCard`/`SkeletonSection` (skeletons fill with `--surface-sunken` so they stay visible on the white surface), `Textarea`, `FilterChip`, `BrandMark`/`BrandWordmark`. Typography roles: `.text-display` … `.text-chart-annotation` (globals.css); `.font-stat`/`.metric-value` remain as aliases.

## Deferred to 4B.2+

Grouped sidebar + mobile bottom navigation; nav label renames (Today, Weekly review); fasting nav gating; route-level filter rows migrating to `FilterChip`; page-level skeleton adoption (`/nutrition`, `/profile` still show text loading); raw `<textarea>`/`<input>` usages migrating to primitives; the dense-decision sheet; per-section profile saves; `.shred-card` removal.
