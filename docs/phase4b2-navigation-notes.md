# Phase 4B.2 — Navigation Shell Notes

Companion to `docs/phase4a-ux-information-architecture-audit.md` (the authoritative IA brief) and `docs/phase4b1-foundation-notes.md`. This phase replaces the flat 12-item navigation with the approved grouped shell. **Current shell vs later route redesign:** 4B.2 changes navigation chrome only — page content, forms, queries, and business logic are untouched and redesign lands per-route in 4B.3–4B.6.

## Structure

- `route-match.ts` — the **single source of truth** for routes, user-facing labels, grouping, More-surface order, mobile pillars, and active matching. Pure data + pure functions (no React, no icons) so the harness imports and exercises the real logic.
- `nav-items.ts` — the **single icon source of truth**: one lucide-react component per destination id, named imports only (tree-shakeable). Coach's former `Sparkles` (generic "AI magic") is retired for `Compass`.
- `Sidebar` (desktop), `TopBar` + `MoreSheet` (mobile utility surface), `MobileBottomNav` (five pillars), `ui/sheet` (Radix Dialog-based primitive) all consume those two modules; no component declares its own route strings or icons.

## Label-only rename policy (Phase 4A decision)

`/dashboard` displays **Today**; `/check-in` displays **Weekly review**. URLs, route folders, and API routes are unchanged; **no redirects** exist or will be added through 4C. The only route-page edit in this phase is the `/dashboard` metadata title (`Dashboard` → `Today`) — a copy-only change so the browser tab agrees with the shell. The `/check-in` page title and H1 already said "Weekly review" (Phase 3A).

Known label/heading mismatches (accepted, page redesigns fix them later): `/coach` H1 is "Coach actions" (shell says "Coach"); `/decisions` H1 is "Decision log" (shell says "Decisions"); `/food` H1 is "Food log" (matches).

## Active matching precedence

Documented in `route-match.ts`: normalize (strip query/hash, trailing slash) → prefix match only on `href` boundary (`href + '/'`, never substring) → **longest match wins** (so `/workouts/routines` activates Routines, not Workouts; `/workouts/[id]` activates Workouts) → `exact` items (Today) never inherit subroutes. Mobile pillars use the same longest-prefix rule over per-pillar prefix lists; `/profile` and `/onboarding` map to **no** pillar (Profile is not a slot — the More surface shows the current-route indicator instead). Fasting maps to the Progress pillar when visited.

## Mobile navigation

Exactly **five** pillars — Today `/dashboard`, Train `/workouts`, Fuel `/food`, Progress `/progress`, Coach `/coach`. No sixth slot, no Profile slot. Fixed bottom, `lg:hidden`, safe-area inset via `pb-[env(safe-area-inset-bottom)]`; `<main>` gets `pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0` so content is never covered. Touch targets are ≥56px tall rows. Active = top brand bar + heavier stroke + font weight + `aria-current` — never color alone.

## More surface

Opens from the TopBar trigger (lucide `Menu`, labeled "More options") — not a bottom-nav slot. Contents in order: Profile, Decisions, Weekly review, Weigh-in, Activity, Fasting (only when enabled), Saved meals, Nutrition targets; then the account email (muted, truncated) and **Sign out** in a separated footer — an action, not a destination. Built on the Radix `Dialog` from the already-installed `radix-ui` package (no new dependency): focus trap, Escape, outside-click close, focus return, and scroll lock come from Radix. Navigation closes the sheet (controlled state). No persistence, no menu customization.

## Fasting visibility

`user_profiles.fasting_enabled` is the existing authoritative field. It is read **once, server-side, in the (app) layout** alongside the existing auth check, and passed as a plain boolean prop to Sidebar and TopBar/MoreSheet — no client profile fetch in the shell, no flash, no duplicated profile state. `profile?.fasting_enabled === true` means a failed or missing read gates the item **off** (a query failure is never treated as enabled). `/fasting` remains reachable by direct URL regardless; its route behavior is unchanged this phase. The Profile page already calls `router.refresh()` after saving, which re-renders this server layout, so toggling the setting updates the navigation without extra wiring.

## Responsive breakpoints

Tailwind defaults only — but the shell switch moved from the old flat shell's `md` (768px) to **`lg` (1024px)** after browser QA (Phase 4B.2 correction). The grouped sidebar is a 224px column with six group headings and up to 15 rows; at 768–1023px it left route content — Decisions filters, Exercise library rows — visibly cramped, a squeezed desktop rather than an intentional tablet layout. The five-slot bottom navigation and More sheet are comfortable at those widths, so tablets keep the mobile shell. **Below `lg`** (phones and tablets) = TopBar + bottom nav + More sheet + safe bottom padding; **`lg` and above** = grouped sidebar + slim label strip, no bottom nav, no More trigger. Every coordinated class (sidebar visibility, TopBar density, brand-mark visibility, More trigger, bottom-nav visibility, content bottom padding) switches at the same `lg` token — no mixed `md`/`lg` shell breakpoints. No custom pixel breakpoint was invented.

## TopBar and account identity

Mobile: brand mark + route-aware label + More trigger. Desktop: slim strip with the route label only — the wordmark stays in the sidebar (no duplication) and the label is a `<span>`, not a heading, since every page keeps its own H1. The account **email moved from the old desktop top strip to the Sidebar utility footer** (and the More sheet footer on mobile), truncated with a `title` tooltip — it was visually noisy as a right-aligned strip. Sign out moved with it (same existing `POST /api/auth/signout` form — the old client-side `supabase.auth.signOut()` path in the retired drawer is gone; one sign-out mechanism everywhere).

## Contextual navigation

`WorkoutsSubNav` (Workouts / Routines / Exercise library) is preserved as-is except one approved-terminology copy change: "Library" → "Exercise library". Food ↔ Saved meals links, Nutrition targets access from Fuel, and the Coach/Weekly review/Decisions and Progress/Weigh-in/Activity relationships are unchanged — the grouped sidebar and More surface now also expose them globally.

## Client/server boundary

The (app) layout stays a **server component** (auth gate + one `fasting_enabled` read). Only the four small shell components are client components (`usePathname`/sheet state); each consumes `usePathname` directly — three consumers, no shared context needed at this size (React dedupes the subscription; a context would add indirection without removing renders). Page content is never pulled into a client boundary by the shell. Icons are named lucide imports (tree-shakeable); no barrel import, no dynamic icon lookup, no new dependency, no new API endpoint, no persistence.

## Accessibility (implemented, not a compliance claim)

Sidebar/bottom nav/More list are `<nav>` landmarks with distinct labels (`Primary` ×2 scoped by viewport, `More destinations`); group headings are non-interactive `div`s; links are real links with `aria-current="page"`; icons are `aria-hidden` (text labels always present); icon-only triggers are labeled ("More options", "Close menu"); the sheet has a `Dialog.Title` ("More"); focus-visible styling comes from the 4B.1 global treatment; keyboard order follows visual order. This is a foundation, **not** a WCAG conformance claim.

## Deferred to 4B.3+

Route-level page redesigns (Dashboard first); per-page max-width/typography passes; the `.shred-card` alias removal; page H1 alignment where it still differs from shell labels; skeleton adoption in routes; any tablet-specific shell tuning if QA shows a need; collapse-to-icon sidebar (not supported by the old shell, deliberately not introduced).
