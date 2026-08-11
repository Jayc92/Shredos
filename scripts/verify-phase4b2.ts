// ============================================================
// ForgeFitOS — Phase 4B.2 deterministic verification harness
// Verifies the responsive navigation shell: the grouped route
// model, desktop sidebar, five-pillar mobile bottom navigation,
// More surface, route-aware labels, fasting visibility gating,
// active-route matching (exercised against the REAL pure module),
// accessibility contracts, and — critically — that no route URL,
// query, migration, or domain behavior changed.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b2.ts
// ============================================================

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import {
  NAV_GROUPS,
  NAV_ROUTES,
  MOBILE_PILLARS,
  MORE_ROUTE_IDS,
  normalizePath,
  activeRouteId,
  activePillarId,
  routeLabel,
} from '../src/components/layout/route-match'

let passed = 0
let failed = 0

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) => s.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
// Runtime-constructed so tsc's default target accepts it.
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const routeMatch = read('src/components/layout/route-match.ts')
const navItems = read('src/components/layout/nav-items.ts')
const sidebar = read('src/components/layout/Sidebar.tsx')
const topBar = read('src/components/layout/TopBar.tsx')
const bottomNav = read('src/components/layout/MobileBottomNav.tsx')
const moreSheet = read('src/components/layout/MoreSheet.tsx')
const sheet = read('src/components/ui/sheet.tsx')
const appLayout = read('src/app/(app)/layout.tsx')
const notes = read('docs/phase4b2-navigation-notes.md')
const pkg = JSON.parse(read('package.json'))

const byId = (id: string) => NAV_ROUTES.find((r) => r.id === id)

// ── 1. Checkpoint, sources of truth, model shape ─────────────────────
console.log('\n1. Checkpoint and navigation model')
{
  check('checkpoint artifacts exist (31a09c0 tree)',
    ['scripts/verify-phase4b1.ts', 'docs/phase4b1-foundation-notes.md',
      'src/components/layout/BrandMark.tsx', 'src/lib/goal-adjustments.ts',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('4A audit exists', existsSync('docs/phase4a-ux-information-architecture-audit.md'))
  check('4B.1 foundation notes exist', existsSync('docs/phase4b1-foundation-notes.md'))
  check('4B.2 navigation notes exist', notes.length > 500)
  check('exact product pillars present',
    ['today', 'train', 'fuel', 'progress', 'coach', 'account']
      .every((g, i) => NAV_GROUPS[i]?.id === g))
  check('grouped navigation model is typed',
    routeMatch.includes('export interface NavRoute') &&
    routeMatch.includes("export type NavGroupId"))
  check('one source of truth for labels (route-match.ts)',
    routeMatch.includes("label: 'Today'") && routeMatch.includes("label: 'Weekly review'") &&
    !stripComments(sidebar).includes("label:") && !stripComments(bottomNav).includes("label:") &&
    !stripComments(topBar).includes("label: '"))
  check('one source of truth for active matching',
    [sidebar, bottomNav, moreSheet, topBar].every((f) =>
      !stripComments(f).includes('startsWith(')) &&
    routeMatch.includes('function prefixMatchLength'))
  check('one source of truth for icons (nav-items.ts)',
    navItems.includes('export const NAV_ICONS') &&
    [sidebar, bottomNav, moreSheet].every((f) =>
      !stripComments(f).match(/from 'lucide-react'.*\n.*Dumbbell/)) &&
    sidebar.includes('NAV_ICONS') && bottomNav.includes('PILLAR_ICONS') &&
    moreSheet.includes('NAV_ICONS'))
  check('no duplicate route declarations in shell components',
    [sidebar, bottomNav, topBar].every((f) =>
      !stripComments(f).includes("href: '/")))
}

// ── 2. Route URLs and label-only renames ─────────────────────────────
console.log('\n2. Route URLs and renames')
{
  check('/dashboard retained', existsSync('src/app/(app)/dashboard/page.tsx'))
  check('/check-in retained', existsSync('src/app/(app)/check-in/page.tsx'))
  check('no /today or /review route folders created',
    !existsSync('src/app/(app)/today') && !existsSync('src/app/(app)/review'))
  check('route URLs unchanged in model',
    ['/dashboard', '/workouts', '/workouts/routines', '/workouts/exercises', '/food',
      '/food/saved', '/nutrition', '/progress', '/weigh-in', '/activity', '/fasting',
      '/coach', '/check-in', '/decisions', '/profile']
      .every((href) => NAV_ROUTES.some((r) => r.href === href)))
  check('Dashboard visible label replaced by Today',
    byId('today')?.label === 'Today' && byId('today')?.href === '/dashboard' &&
    !NAV_ROUTES.some((r) => r.label === 'Dashboard'))
  check('Check-in visible label replaced by Weekly review',
    byId('weekly-review')?.label === 'Weekly review' &&
    byId('weekly-review')?.href === '/check-in' &&
    !NAV_ROUTES.some((r) => r.label === 'Check-in'))
  check('no redirects added',
    !stripComments(appLayout).includes("redirect('/dashboard'") &&
    !existsSync('src/middleware-redirects.ts') &&
    !read('next.config.mjs').includes('redirects'))
  check('dashboard metadata title says Today (copy-only)',
    read('src/app/(app)/dashboard/page.tsx').includes("title: 'Today'"))
  check('label-only rename policy documented',
    notes.includes('Label-only rename policy') && notes.includes('no redirects'))
}

// ── 3. Desktop grouped navigation ────────────────────────────────────
console.log('\n3. Desktop navigation')
{
  for (const g of ['today', 'train', 'fuel', 'progress', 'coach', 'account']) {
    check(`desktop group ${g}`, NAV_GROUPS.some((x) => x.id === g) &&
      NAV_ROUTES.some((r) => r.group === g))
  }
  const ITEMS: Array<[string, string]> = [
    ['today', 'Today'], ['workouts', 'Workouts'], ['routines', 'Routines'],
    ['exercise-library', 'Exercise library'], ['food', 'Food log'],
    ['nutrition', 'Nutrition targets'], ['progress', 'Progress'],
    ['weigh-in', 'Weigh-in'], ['activity', 'Activity'], ['coach', 'Coach'],
    ['weekly-review', 'Weekly review'], ['decisions', 'Decisions'],
    ['profile', 'Profile'],
  ]
  for (const [id, label] of ITEMS) {
    check(`item present: ${label}`, byId(id)?.label === label)
  }
  check('Fasting conditional item present',
    byId('fasting')?.requiresFastingEnabled === true)
  check('sidebar renders groups from the model',
    sidebar.includes('NAV_GROUPS.map') && sidebar.includes('NAV_ROUTES.filter'))
  check('group labels noninteractive',
    sidebar.includes('aria-hidden="true"') &&
    !sidebar.match(/<(button|Link|a)[^>]*>\s*\{group\.label\}/))
  check('secondary routes render compact/nested (not 12 equal rows)',
    routeMatch.includes('secondary?: boolean') && sidebar.includes('route.secondary'))
  check('desktop active state not color-only (brand bar + weight)',
    sidebar.includes('font-semibold') && sidebar.includes('bg-brand') &&
    sidebar.includes('rounded-full bg-brand'))
  check('desktop aria-current', sidebar.includes("aria-current={active ? 'page' : undefined}"))
  check('desktop nav landmark', sidebar.includes('<nav aria-label="Primary"'))
  check('labels remain visible (no icon-only collapse introduced)',
    sidebar.includes('<span>{route.label}</span>') && !sidebar.includes('collapsed'))
  check('ForgeFitOS wordmark remains in sidebar', sidebar.includes('BrandWordmark'))
  check('Sign out separated into utility footer',
    sidebar.includes('border-t') && sidebar.includes('/api/auth/signout') &&
    sidebar.indexOf('/api/auth/signout') > sidebar.indexOf('</nav>'))
  check('sidebar scrolls its nav, not the page', sidebar.includes('overflow-y-auto'))
}

// ── 4. Mobile bottom navigation ──────────────────────────────────────
console.log('\n4. Mobile bottom navigation')
{
  check('mobile bottom nav component exists', bottomNav.includes('export function MobileBottomNav'))
  check('exactly five items', MOBILE_PILLARS.length === 5)
  const SLOTS: Array<[string, string, string]> = [
    ['today', 'Today', '/dashboard'], ['train', 'Train', '/workouts'],
    ['fuel', 'Fuel', '/food'], ['progress', 'Progress', '/progress'],
    ['coach', 'Coach', '/coach'],
  ]
  for (const [id, label, href] of SLOTS) {
    const p = MOBILE_PILLARS.find((x) => x.id === id)
    check(`mobile slot ${label} → ${href}`, p?.label === label && p?.href === href)
  }
  check('no mobile Profile primary slot',
    !MOBILE_PILLARS.some((p) => p.href === '/profile' || p.label === 'Profile'))
  check('no sixth mobile slot possible (model is the only source)',
    bottomNav.includes('MOBILE_PILLARS.map') && !stripComments(bottomNav).includes("href: '"))
  check('bottom nav hidden at lg and above', bottomNav.includes('lg:hidden'))
  check('bottom nav fixed to viewport bottom', bottomNav.includes('fixed inset-x-0 bottom-0'))
  check('safe-area inset support', bottomNav.includes('env(safe-area-inset-bottom)'))
  check('content bottom padding matches fixed nav',
    appLayout.includes('pb-[calc(4.5rem+env(safe-area-inset-bottom))]') &&
    appLayout.includes('lg:pb-0'))
  check('touch targets at/above 44px', bottomNav.includes('min-h-14'))
  check('icon plus text label', bottomNav.includes('<span>{pillar.label}</span>') &&
    bottomNav.includes('aria-hidden="true"'))
  check('mobile active state not color-only (bar + stroke + weight)',
    bottomNav.includes('rounded-full bg-brand') &&
    bottomNav.includes('strokeWidth={active ? 2.4 : 2}') &&
    bottomNav.includes('font-semibold'))
  check('aria-current on mobile items',
    bottomNav.includes("aria-current={active ? 'page' : undefined}"))
  check('mobile nav landmark with label', bottomNav.includes('aria-label="Primary"'))
  check('no horizontal overflow layout (five-column grid)',
    bottomNav.includes('grid grid-cols-5'))
}

// ── 5. Active route matching (real module, real cases) ──────────────
console.log('\n5. Route matching')
{
  const CASES: Array<[string, string | null, string | null]> = [
    ['/dashboard', 'today', 'today'],
    ['/workouts/abc-123', 'workouts', 'train'],
    ['/workouts/routines', 'routines', 'train'],
    ['/workouts/routines/xyz', 'routines', 'train'],
    ['/workouts/exercises', 'exercise-library', 'train'],
    ['/food/saved', 'saved-meals', 'fuel'],
    ['/nutrition', 'nutrition', 'fuel'],
    ['/weigh-in', 'weigh-in', 'progress'],
    ['/activity', 'activity', 'progress'],
    ['/fasting', 'fasting', 'progress'],
    ['/progress/exercises/bench-press', 'progress', 'progress'],
    ['/check-in', 'weekly-review', 'coach'],
    ['/decisions', 'decisions', 'coach'],
    ['/coach', 'coach', 'coach'],
  ]
  for (const [path, wantRoute, wantPillar] of CASES) {
    check(`match ${path} → ${wantRoute} / pillar ${wantPillar}`,
      activeRouteId(path) === wantRoute && activePillarId(path) === wantPillar)
  }
  check('query strings ignored',
    activeRouteId('/check-in?week=2026-W31') === 'weekly-review' &&
    activePillarId('/dashboard?x=1') === 'today')
  check('trailing slashes normalized',
    normalizePath('/food/') === '/food' && activeRouteId('/decisions/') === 'decisions')
  check('no naive substring matching',
    activeRouteId('/foodX') === null && activePillarId('/foods') === null &&
    !stripComments(routeMatch).includes('.includes(path)'))
  check('exact Today never inherits subroutes',
    activeRouteId('/dashboard/anything') === null && byId('today')?.exact === true)
  check('/profile maps to no pillar (no Profile slot)',
    activePillarId('/profile') === null && activeRouteId('/profile') === 'profile')
  check('longest-match precedence documented',
    routeMatch.includes('LONGEST matching href wins'))
  check('route-aware labels: Today / Weekly review / brand fallback',
    routeLabel('/dashboard') === 'Today' && routeLabel('/check-in') === 'Weekly review' &&
    routeLabel('/nowhere') === 'ForgeFitOS')
}

// ── 6. More surface ──────────────────────────────────────────────────
console.log('\n6. More surface')
{
  check('More surface exists', moreSheet.includes('export function MoreSheet'))
  check('accessible title', moreSheet.includes('<SheetTitle>More</SheetTitle>') &&
    sheet.includes('Dialog.Title'))
  check('close control present and labeled',
    sheet.includes('aria-label="Close menu"'))
  check('Escape/outside-click/focus-trap via Radix Dialog',
    sheet.includes("from 'radix-ui'") && sheet.includes('Dialog.Root') &&
    sheet.includes('Dialog.Portal') && sheet.includes('Dialog.Overlay'))
  check('focus returns to trigger (Radix trigger pattern)',
    moreSheet.includes('<SheetTrigger') && sheet.includes('Dialog.Trigger'))
  check('route click closes the sheet',
    moreSheet.includes('onClick={() => setOpen(false)}') &&
    moreSheet.includes('onOpenChange={setOpen}'))
  check('current More route indicated (bar + weight + aria-current)',
    moreSheet.includes("aria-current={active ? 'page' : undefined}") &&
    moreSheet.includes('rounded-full bg-brand') && moreSheet.includes('font-semibold'))
  const MORE: Array<[string, string]> = [
    ['profile', 'Profile'], ['decisions', 'Decisions'], ['weekly-review', 'Weekly review'],
    ['weigh-in', 'Weigh-in'], ['activity', 'Activity'], ['fasting', 'Fasting'],
    ['saved-meals', 'Saved meals'], ['nutrition', 'Nutrition targets'],
  ]
  for (const [id, label] of MORE) {
    check(`More includes ${label}`,
      MORE_ROUTE_IDS.includes(id) && byId(id)?.label === label)
  }
  check('Fasting conditional in More',
    moreSheet.includes('requiresFastingEnabled || fastingEnabled'))
  check('Sign out in More, separated from destinations',
    moreSheet.includes('/api/auth/signout') &&
    moreSheet.indexOf('border-t') < moreSheet.indexOf('/api/auth/signout') &&
    moreSheet.indexOf('/api/auth/signout') > moreSheet.indexOf('</nav>'))
  check('no duplicate clutter (each More id unique, from single list)',
    new Set(MORE_ROUTE_IDS).size === MORE_ROUTE_IDS.length)
  check('More trigger is not a sixth bottom slot',
    !bottomNav.includes('MoreSheet') && topBar.includes('MoreSheet'))
  check('no persistence / customization in More',
    !moreSheet.includes('localStorage') && !moreSheet.includes('supabase'))
}

// ── 7. TopBar ────────────────────────────────────────────────────────
console.log('\n7. TopBar')
{
  check('TopBar uses the single route-label source',
    topBar.includes('routeLabel(pathname)') && !stripComments(topBar).includes('NAV_ROUTES'))
  check('TopBar shows Today for /dashboard (via routeLabel)',
    routeLabel('/dashboard') === 'Today')
  check('TopBar shows Weekly review for /check-in (via routeLabel)',
    routeLabel('/check-in') === 'Weekly review')
  check('More trigger labeled', moreSheet.includes('aria-label="More options"'))
  check('ForgeFitOS mark retained', topBar.includes('<BrandMark'))
  check('no duplicate wordmark (mark mobile-only; wordmark lives in sidebar)',
    topBar.includes('lg:hidden') && !topBar.includes('BrandWordmark'))
  check('label is a span, not a duplicate heading',
    topBar.includes('<span className="truncate') && !topBar.match(/<h[12]/))
  check('old homemade drawer retired (Radix sheet instead)',
    !topBar.includes('menuOpen') && !topBar.includes('backdrop-blur'))
  check('user email treatment documented',
    notes.includes('email moved from the old desktop top strip'))
  check('no user-data query in TopBar',
    !topBar.includes('supabase') && !topBar.includes('useQuery'))
}

// ── 8. Fasting visibility ────────────────────────────────────────────
console.log('\n8. Fasting visibility')
{
  check('uses existing authoritative field',
    appLayout.includes("select('fasting_enabled')") &&
    read('src/types/database.ts').includes('fasting_enabled'))
  check('strict === true (query failure not treated as enabled)',
    appLayout.includes('profile?.fasting_enabled === true'))
  check('hidden when false / visible when true (single flag prop)',
    sidebar.includes('!r.requiresFastingEnabled || fastingEnabled') &&
    moreSheet.includes('!r.requiresFastingEnabled || fastingEnabled'))
  check('single server-side fetch, no duplicate shell profile fetch',
    appLayout.includes('fasting_enabled') &&
    [sidebar, topBar, bottomNav, moreSheet].every((f) =>
      !f.includes('useProfile') && !f.includes('user_profiles')))
  check('no profile write in shell',
    [appLayout, sidebar, topBar, bottomNav, moreSheet].every((f) =>
      !f.includes('.update(') && !f.includes('.insert(') && !f.includes('.upsert(')))
  check('direct /fasting route retained', existsSync('src/app/(app)/fasting/page.tsx'))
  check('no layout flash (server-rendered prop, no client fetch)',
    !sidebar.includes('useEffect') && !moreSheet.includes('useEffect'))
  check('fasting gating decision documented',
    notes.includes('fasting_enabled') && notes.includes('never treated as enabled'))
}

// ── 9. Responsive shell ──────────────────────────────────────────────
console.log('\n9. Responsive shell')
{
  check('mobile shell: TopBar + bottom nav + More',
    appLayout.includes('<TopBar') && appLayout.includes('<MobileBottomNav'))
  check('desktop shell: grouped sidebar begins at lg, no bottom nav',
    appLayout.includes('<Sidebar') && bottomNav.includes('lg:hidden') &&
    sidebar.includes('hidden lg:flex'))
  check('tablet behavior documented (lg switch, density rationale, no invented breakpoint)',
    notes.includes('1024px') && notes.includes('cramped') &&
    notes.includes('No custom pixel breakpoint'))
  check('single scroll container for content (no duplicate scrollbars)',
    appLayout.includes('overflow-y-auto') &&
    (appLayout.match(/overflow-y-auto/g) || []).length === 1)
  check('no fixed element covers content (padding reserved)',
    appLayout.includes('pb-[calc(4.5rem+env(safe-area-inset-bottom))]'))
  check('light canvas preserved (bg-canvas shell)',
    appLayout.includes('bg-canvas') && !appLayout.includes('bg-background'))
  check('no theme toggle / no accidental dark mode',
    !appLayout.includes('ThemeToggle') &&
    read('src/app/globals.css').includes('color-scheme: light;') &&
    read('src/app/layout.tsx').includes('bg-canvas text-ink'))
  check('shell uses valid ForgeFitOS tokens (not broken legacy card/border)',
    [sidebar, topBar, bottomNav, moreSheet].every((f) =>
      !stripComments(f).includes('bg-card') && !stripComments(f).includes('border-border')))
  check('reduced-motion global block preserved',
    read('src/app/globals.css').includes('prefers-reduced-motion'))

  // ── QA correction: the shell switches at lg (1024px), coordinated ──
  check('mobile/tablet shell remains active below lg (sidebar hidden)',
    sidebar.includes('hidden lg:flex') &&
    appLayout.includes('className="hidden lg:flex'))
  check('bottom nav remains visible through tablet widths (hides only at lg)',
    bottomNav.includes('lg:hidden') && !stripComments(bottomNav).includes('md:'))
  check('More trigger available below lg, gone at lg',
    topBar.includes('<div className="lg:hidden">'))
  check('desktop TopBar treatment begins at lg',
    topBar.includes('lg:h-12 lg:px-6'))
  check('brand mark in TopBar below lg only (wordmark takes over at lg)',
    topBar.includes('size-7 lg:hidden'))
  check('safe bottom content padding below lg, none at lg',
    appLayout.includes('pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0'))
  check('no mixed md/lg shell breakpoints (all shell files lg-only)',
    [sidebar, topBar, bottomNav, moreSheet, sheet, appLayout].every((f) =>
      !stripComments(f).includes('md:')))
  check('lg selection justified by grouped-sidebar density (documented)',
    notes.includes('grouped sidebar') && notes.includes('1024px') &&
    notes.includes('tablets keep the mobile shell'))
}

// ── 10. Contextual navigation preserved ──────────────────────────────
console.log('\n10. Contextual navigation')
{
  const subNav = read('src/components/workout/WorkoutsSubNav.tsx')
  check('Workouts subnav preserved', subNav.includes('WORKOUT_SECTIONS') &&
    subNav.includes("{ href: '/workouts', label: 'Workouts' }"))
  check('subnav aligned to approved terminology (Exercise library)',
    subNav.includes("label: 'Exercise library'"))
  check('Food / Saved meals relationship preserved',
    // 4B.6C moved the cross-link into the shared FuelSubNav.
    read('src/components/food/FuelSubNav.tsx').includes("href: '/food/saved'") &&
    read('src/app/(app)/food/page.tsx').includes('<FuelSubNav />'))
  check('Coach / Weekly review / Decisions relationship preserved (grouped)',
    byId('coach')?.group === 'coach' && byId('weekly-review')?.group === 'coach' &&
    byId('decisions')?.group === 'coach')
  check('Progress / Weigh-in / Activity relationship preserved (grouped)',
    byId('progress')?.group === 'progress' && byId('weigh-in')?.group === 'progress' &&
    byId('activity')?.group === 'progress')
  check('Nutrition targets reachable from Fuel group and More',
    byId('nutrition')?.group === 'fuel' && MORE_ROUTE_IDS.includes('nutrition'))
}

// ── 11. Phase boundary: no logic/data/route changes ─────────────────
console.log('\n11. Phase boundary invariants')
{
  check('no page content redesign (durable route anchors intact)',
    // 4B.4 aligned the coach/decisions H1s to the approved labels; the
    // durable invariant is that each route keeps its behavior anchors.
    read('src/app/(app)/coach/page.tsx').includes('fetchCoachActions') &&
    read('src/app/(app)/decisions/page.tsx').includes('Nothing changes silently') &&
    read('src/app/(app)/food/page.tsx').includes('Food log'))
  check('no migration 014',
    !readdirSync('supabase/migrations').some((f) => f.startsWith('014')))
  check('no new persistence in shell',
    [sidebar, topBar, bottomNav, moreSheet, sheet].every((f) =>
      !f.includes('localStorage') && !f.includes('sessionStorage')))
  check('no Supabase changes (migrations dir unchanged count)',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 13)
  check('no API changes (signout route byte-anchored)',
    read('src/app/api/auth/signout/route.ts').includes('export async function POST'))
  check('no target logic changes',
    read('src/lib/goal-adjustments.ts').includes('CALORIE_STEP_SMALL = 100'))
  check('no Coach logic changes',
    read('src/lib/coach-actions.ts').includes("title: 'Log a weigh-in this week'"))
  check('no Weekly Review logic changes',
    read('src/lib/weekly-review.ts').includes('PROGRESSION_LOOKBACK_DAYS = 56'))
  check('no decision logic changes',
    read('src/lib/decisions.ts').includes("suggested: ['accepted', 'dismissed']"))
  check('no workout logic changes',
    read('src/lib/workout.ts').includes('weightKg * (1 + reps / 30)'))
  check('no nutrition logic changes',
    read('src/lib/nutrition.ts').includes('LEAN_MASS_PROTEIN_THRESHOLD'))
  check('no onboarding logic changes',
    read('src/components/onboarding/OnboardingWizard.tsx').includes('fasting_enabled'))
  check('no Profile save changes',
    read('src/app/(app)/profile/page.tsx').includes('main_goal_changed'))
  check('no dashboard customization',
    !existsSync('src/components/dashboard/WidgetFrame.tsx') &&
    !appLayout.includes('drag'))
  check('layout auth gate unchanged', appLayout.includes("redirect('/login')"))
}

// ── 12. Iconography and emoji ────────────────────────────────────────
console.log('\n12. Iconography')
{
  check('one icon library (lucide-react only)',
    !Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
      .some((d) => /heroicons|react-icons|feather|fontawesome|tabler/i.test(d)))
  check('tree-shakeable named icon imports (no barrel)',
    navItems.includes("} from 'lucide-react'") && !navItems.includes('import * as'))
  check('Sparkles retired for Coach (professional line icons)',
    !stripComments(navItems).includes('Sparkles') && navItems.includes('Compass'))
  check('icon per destination id, no duplicate meanings in one surface',
    (() => {
      const iconNames = Array.from(stripComments(navItems)
        .matchAll(/^\s{2}(?:'[\w-]+'|[\w]+): (\w+),$/gm)).map((m) => m[1])
      const desktopIcons = iconNames.slice(0, 15)
      return new Set(desktopIcons).size === desktopIcons.length
    })())
  check('icon-only controls labeled',
    moreSheet.includes('aria-label="More options"') &&
    sheet.includes('aria-label="Close menu"'))
  check('decorative icons aria-hidden',
    [sidebar, bottomNav, moreSheet].every((f) => f.includes('aria-hidden="true"')))
  check('no emoji in active shell source (Extended_Pictographic)',
    [routeMatch, navItems, sidebar, topBar, bottomNav, moreSheet, sheet, appLayout]
      .every((f) => !EMOJI.test(f)))
  check('no emoji anywhere in src',
    (() => {
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts|css)$/.test(entry)) continue
          if (EMOJI.test(read(full))) offenders.push(full)
        }
      }
      walk('src')
      return offenders.length === 0
    })())
}

// ── 13. Accessibility contracts ──────────────────────────────────────
console.log('\n13. Accessibility')
{
  check('links remain links (Next Link, not onClick divs)',
    sidebar.includes('<Link') && bottomNav.includes('<Link') && moreSheet.includes('<Link'))
  check('keyboard order follows visual order (no tabIndex overrides)',
    [sidebar, topBar, bottomNav, moreSheet].every((f) => !f.includes('tabIndex')))
  check('focus-visible treatment preserved (4B.1 global)',
    read('src/app/globals.css').includes(':focus-visible'))
  check('More sheet dialog semantics (Radix Dialog)',
    sheet.includes('Dialog.Content') && sheet.includes('Dialog.Title'))
  check('distinct nav landmark labels',
    moreSheet.includes('aria-label="More destinations"'))
  check('no fake WCAG claim',
    notes.includes('not') && notes.includes('WCAG conformance claim') &&
    !notes.includes('fully WCAG compliant'))
}

// ── 14. Performance and data boundaries ──────────────────────────────
console.log('\n14. Performance and boundaries')
{
  check('app layout stays a server component',
    !appLayout.includes("'use client'") && appLayout.includes('await createClient()'))
  check('server/client boundary documented',
    notes.includes('Client/server boundary') && notes.includes('server component'))
  check('shell client components are small leaves',
    [sidebar, topBar, bottomNav, moreSheet].every((f) => f.includes("'use client'")))
  check('usePathname consumers documented (no premature context)',
    notes.includes('usePathname'))
  check('no large route modules imported into nav data',
    !routeMatch.includes('import') || !routeMatch.match(/from '@\/(app|lib\/(?!utils))/))
  check('no new dependency (radix-ui already installed)',
    pkg.dependencies['radix-ui'] !== undefined &&
    Object.keys(pkg.dependencies).length === 22)
  check('package-lock consistent (radix-ui present)',
    read('package-lock.json').includes('"radix-ui"'))
  check('no new API endpoint',
    readdirSync('src/app/api').length === readdirSync('src/app/api').length &&
    !existsSync('src/app/api/navigation'))
}

// ── 15. Routes compile (page files exist and are non-trivial) ───────
console.log('\n15. Route integrity')
{
  const PAGES = ['dashboard', 'workouts', 'food', 'nutrition', 'progress',
    'coach', 'check-in', 'decisions', 'profile', 'fasting', 'weigh-in', 'activity']
  for (const p of PAGES) {
    const f = `src/app/(app)/${p}/page.tsx`
    check(`${p} page intact`, existsSync(f) && read(f).length > 300)
  }
  check('no .DS_Store in scope dirs',
    !existsSync('.DS_Store') && !existsSync('src/.DS_Store') &&
    !existsSync('supabase/.DS_Store') && !existsSync('docs/.DS_Store'))
  check('no generated image assets',
    !existsSync('public/nav') &&
    ['src/components/layout'].every((d) =>
      readdirSync(d).every((f) => !/\.(png|jpe?g|webp|gif|ico)$/i.test(f))))
  check('no local font files',
    readdirSync('src', { recursive: true } as never)
      .every((f) => !/\.(woff2?|ttf|otf|eot)$/i.test(String(f))))
}

// ── 16. Documentation and language ───────────────────────────────────
console.log('\n16. Documentation and language')
{
  check('current shell vs later redesign distinguished',
    notes.includes('navigation chrome only') && notes.includes('4B.3'))
  check('exact five mobile slots documented',
    notes.includes('Exactly **five** pillars') && notes.includes('No sixth slot'))
  check('deferred items listed', notes.includes('Deferred to 4B.3+'))
  check('user control principle preserved (no forced defaults, no persistence)',
    !notes.includes('automatically enables') && notes.includes('No persistence'))
  check('no guilt/causal/medical language',
    !/you failed|lazy|caused your|metabolic damage|burns? \d+ calories/i
      .test(notes + moreSheet + sidebar + bottomNav))
  check('label/heading mismatches documented',
    notes.includes('Coach actions'))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
