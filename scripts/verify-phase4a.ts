// ============================================================
// ShredOS — Phase 4A deterministic verification harness
// Verifies that docs/phase4a-ux-information-architecture-audit.md is
// complete (routes, components, source-of-truth conflicts, design
// system, plans) AND that its factual claims match the actual
// repository — plus that Phase 4A changed no production behavior:
// no migration 014, no rebrand strings in src, no new dependencies,
// no route renames.
// Deterministic: file reads only, no network, no Date.now().
// Run from the repository root:
//   npx tsx scripts/verify-phase4a.ts
// ============================================================

import { readFileSync, existsSync } from 'fs'

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

const doc = readFileSync('docs/phase4a-ux-information-architecture-audit.md', 'utf8')
const has = (s: string) => doc.includes(s)

// ── 1. Route coverage (every user-facing route, and the files exist) ─
console.log('\n1. Route inventory')
{
  const ROUTES: Array<[string, string]> = [
    ['/', 'src/app/page.tsx'],
    ['/login', 'src/app/(auth)/login/page.tsx'],
    ['/onboarding', 'src/app/(app)/onboarding/page.tsx'],
    ['/dashboard', 'src/app/(app)/dashboard/page.tsx'],
    ['/coach', 'src/app/(app)/coach/page.tsx'],
    ['/check-in', 'src/app/(app)/check-in/page.tsx'],
    ['/decisions', 'src/app/(app)/decisions/page.tsx'],
    ['/profile', 'src/app/(app)/profile/page.tsx'],
    ['/activity', 'src/app/(app)/activity/page.tsx'],
    ['/nutrition', 'src/app/(app)/nutrition/page.tsx'],
    ['/food', 'src/app/(app)/food/page.tsx'],
    ['/food/saved', 'src/app/(app)/food/saved/page.tsx'],
    ['/weigh-in', 'src/app/(app)/weigh-in/page.tsx'],
    ['/fasting', 'src/app/(app)/fasting/page.tsx'],
    ['/workouts', 'src/app/(app)/workouts/page.tsx'],
    ['/workouts/[id]', 'src/app/(app)/workouts/[id]/page.tsx'],
    ['/workouts/routines', 'src/app/(app)/workouts/routines/page.tsx'],
    ['/workouts/routines/[id]', 'src/app/(app)/workouts/routines/[id]/page.tsx'],
    ['/workouts/exercises', 'src/app/(app)/workouts/exercises/page.tsx'],
    ['/progress', 'src/app/(app)/progress/page.tsx'],
    ['/progress/exercises/[id]', 'src/app/(app)/progress/exercises/[id]/page.tsx'],
  ]
  for (const [route, file] of ROUTES) {
    check(`route ${route} documented and file exists`,
      has(`\`${route}\``) && existsSync(file))
  }
  check('route inventory references actual files',
    has('src/app/(auth)/login/page.tsx') && has('src/app/page.tsx'))
}

// ── 2. Component families and navigation reality ─────────────────────
console.log('\n2. Components and navigation')
{
  const FAMILIES = [
    'dashboard', 'coach', 'decisions', 'nutrition', 'food', 'weigh-in',
    'fasting', 'workout', 'routine', 'progress', 'activity', 'onboarding', 'ui',
  ]
  check('every major component family documented',
    FAMILIES.every((f) => existsSync(`src/components/${f}`)) &&
    has('WorkoutsSubNav') && has('MuscleReadinessPanel') && has('DecisionCard') &&
    has('WeightCard') && has('OptionCard'))
  check('component inventory references actual files',
    has('src/components/layout/nav-items.ts') && has('Sidebar.tsx') && has('TopBar.tsx'))

  const nav = readFileSync('src/components/layout/nav-items.ts', 'utf8')
  const NAV = ['Dashboard', 'Weigh-in', 'Workouts', 'Food', 'Activity', 'Nutrition',
    'Fasting', 'Check-in', 'Coach', 'Progress', 'Decisions', 'Profile']
  check('every 4A-audited destination URL retained (grouped model, 4B.2)',
    // 4B.2 replaced the flat 12-item list with the grouped model in
    // route-match.ts; the durable 4A invariant is that every audited
    // destination URL survives, and the audit doc still records the
    // 4A-era inventory it was written against.
    (() => {
      const model = readFileSync('src/components/layout/route-match.ts', 'utf8')
      return ['/dashboard', '/weigh-in', '/workouts', '/food', '/activity',
        '/nutrition', '/fasting', '/check-in', '/coach', '/progress',
        '/decisions', '/profile'].every((h) => model.includes(`href: '${h}'`))
    })() &&
    has('Dashboard, Weigh-in, Workouts, Food, Activity, Nutrition, Fasting, Check-in, Coach, Progress, Decisions, Profile'))
  check('duplicate Food/Nutrition icon finding recorded (resolved in 4B.2)',
    has('UtensilsCrossed'))
  check('fasting always-visible finding recorded (gating landed in 4B.2)',
    has('Fasting appears in navigation even when'))
}

// ── 3. Product pillars and navigation recommendations ────────────────
console.log('\n3. Pillars and navigation recommendations')
{
  for (const pillar of ['Today', 'Train', 'Fuel', 'Progress', 'Coach', 'Profile']) {
    check(`product pillar: ${pillar}`, has(`**${pillar}**`) || has(`| **${pillar}**`))
  }
  check('primary navigation recommendation',
    has('**Primary navigation:** the six pillars'))
  check('mobile navigation recommendation',
    has('bottom navigation') && has('mobile navigation recommendation'))
  check('desktop navigation recommendation',
    has('grouped sidebar') && has('desktop navigation recommendation'))
  check('secondary/contextual/utility navigation defined',
    has('**Secondary navigation:**') && has('**Contextual navigation:**') &&
    has('**Utility navigation:**'))
  check('directly-reachable-but-not-primary routes listed',
    has('**Directly reachable but not primary:**'))
}

// ── 4. Page responsibility matrix and source of truth ────────────────
console.log('\n4. Responsibilities and source of truth')
{
  check('page responsibility matrix present',
    has('| Route | User question | Primary action |'))
  check('keep/merge/rename/split/demote decisions present',
    has('| Decision |') && has('demote') && has('keep'))
  check('source-of-truth section present', has('## Part 3 — Source-of-truth audit'))
  check('weight conflict with actual fields',
    has('user_profiles.current_weight_kg') && has('body_metrics.weight_kg') &&
    has('Baseline weight'))
  check('goal-weight conflict with actual field',
    has('user_profiles.goal_weight_kg') && has('whole-object save'))
  check('step-goal conflict with actual field',
    has('user_profiles.step_goal'))
  check('nutrition target terminology defined',
    has('Calculated recommendation') && has('Active targets') &&
    has('Proposed adjustment') && has('Historical target'))
  check('non-authoritative calculated value rule stated',
    has('Never label a calculated value as current') ||
    has('never label a calculated value') ||
    has('Never label a calculated'))
  check('body-fat source hierarchy',
    has('resolveBodyFatContext') && has('latest measured') &&
    has('user_profiles.bf_pct') || has('profile fallback'))
  check('workout-count definitions audited',
    has('fetchWorkoutWeekStats') && has('completed-only'))
  check('time-window terminology table',
    has('This week (so far)') && has('Last completed week') &&
    has('Current 7-day average') && has('Last 28 days') && has('vs. prior week'))
  check('decisions lifecycle terminology',
    has('follow_through_status') && has('Review now') && has('three separate lifecycles'))
  check('source-of-truth entries state migration impact',
    (doc.match(/No\s+(data\s+)?migration/gi) ?? []).length >= 3)
}

// ── 5. User journeys ─────────────────────────────────────────────────
console.log('\n5. User journeys')
{
  const JOURNEYS = [
    'New user onboarding', 'Daily dashboard visit', 'Starting a workout',
    'Logging food', 'Logging weight', 'Reviewing progress', 'Weekly check-in',
    'Receiving a Coach recommendation', 'Recording a decision',
    'Applying a calorie adjustment', 'Reviewing follow-through/outcome',
    'Editing profile goals', 'Workout-only user', 'Complete-system user',
  ]
  check('all fourteen journeys documented', JOURNEYS.every((j) => has(j)))
  check('journeys include friction and future path',
    (doc.match(/Friction:/g) ?? []).length >= 10 && (doc.match(/Future:/g) ?? []).length >= 10)
}

// ── 6. Dashboard widget architecture ─────────────────────────────────
console.log('\n6. Widget architecture')
{
  check('typed widget contract defined',
    has('DashboardWidgetDefinition') && has('DashboardWidgetPreference') &&
    has('DashboardLayoutItem') && has('DashboardWidgetSize'))
  check('widget sizes vocabulary chosen and justified',
    has("'compact' | 'half' | 'full' | 'expanded'") && has('Justification:'))
  check('current dashboard widget inventory exact',
    ['WeightCard', 'NutritionCard', 'WorkoutCard', 'FastingCard', 'StepsCard', 'DecisionLogCard']
      .every((c) => has(c) && existsSync(`src/components/dashboard/${c}.tsx`)) &&
    has('CoachCard'))
  check('per-widget defaults documented (visibility/size/empty/hideable)',
    has('| Card (component) | Default visibility | Default size'))
  check('future widgets grounded in existing features only',
    has('Weekly review (new completed week ready)') && has('Target adjustment review') &&
    has('Active workout') && has('No speculative features'))
  check('workout-only preset defined', has('**Workout-only**'))
  check('full-system preset defined', has('**Full system**'))
  check('recommended default layout defined', has('**Recommended default**'))
  check('beginner preset explicitly evaluated',
    has('beginner preset is **not justified**'))
  check('hidden widgets keep navigation reachable',
    has('routes remain fully reachable'))
  check('no automatic layout mutation principle',
    has('never applies one automatically') || has('never mutates a saved layout automatically'))
}

// ── 7. Responsive architecture ───────────────────────────────────────
console.log('\n7. Responsive strategy')
{
  check('actual Tailwind breakpoints audited (no custom screens)',
    has('no custom `screens`') &&
    !readFileSync('tailwind.config.ts', 'utf8').includes('screens:'))
  check('current max-w-2xl reality documented',
    has('max-w-2xl') && has('672px'))
  check('responsive strategy with four conceptual tiers',
    has('**mobile**') && has('**tablet**') && has('**desktop**') && has('**wide desktop**'))
  check('Profile mobile/desktop guidance',
    has('**Profile** — sectioned cards') || has('Profile** — sectioned'))
  check('Nutrition layout guidance', has('**Nutrition** — desktop two-column'))
  check('Decisions layout guidance', has('**Decisions** — filters'))
  check('active-workout guidance',
    has('**Active workout**') && has('44px'))
  check('touch-target requirement stated', has('44×44px') || has('44x44'))
}

// ── 8. Visual hierarchy and design system ────────────────────────────
console.log('\n8. Visual hierarchy and design system')
{
  check('visual issues mapped to principles, not patches',
    (doc.match(/\*Principle:/g) ?? []).length >= 8)
  check('color semantic roles listed',
    ['canvas', 'elevated surface', 'brand accent', 'success', 'caution', 'critical',
      'informational', 'chart series', 'workout readiness states'].every((r) => has(r)))
  check('current green overload documented against reality',
    has('mint/green `--primary`') && has('brand') && has('selected') &&
    has('positive trend') &&
    // RETARGET (UI-1A): the reality anchor was the legacy mint literal
    // 162 70% 55%; the dark foundation aligned --primary to the brand
    // token (163 62% 52%) — still the mint family the audit documented.
    readFileSync('src/app/globals.css', 'utf8').includes('--primary: 163 62% 52%'))
  check('mixed HSL/oklch token formats documented and real',
    has('HSL triplets') && has('oklch') &&
    readFileSync('src/app/globals.css', 'utf8').includes('oklch'))
  check('current design-token reality documented',
    has('shred-card') &&
    readFileSync('src/app/globals.css', 'utf8').includes('.shred-card'))
  check('typography roles listed',
    ['display', 'page title', 'section title', 'card title', 'metric', 'chart annotation']
      .every((r) => has(r)))
  check('single-vs-paired family recommendation made (now decided: Geist Sans)',
    has('single variable interface family') && has('no paired display family'))
  check('spacing scale defined', has('4-based (4/8/12/16/24/32/48/64)'))
  check('density levels defined', has('cozy') && has('regular') && has('spacious'))
  check('shape system defined',
    has('Card radius 12px') && has('input radius 8px') && has('badge/chip radius full'))
  check('component inventory with variants/misuse',
    has('| Component | Purpose | Variants | States | Misuse to avoid |'))
  check('button variants specified', has('primary / secondary / ghost / destructive'))
  check('card variants specified', has('flat / raised / outlined'))
  check('notice variants specified', has('info / caution / critical / success'))
  check('form states specified', has('error, disabled, focus'))
  check('loading states as skeletons', has('Skeleton') && has('spinners for content areas'))
  check('empty states specified', has('EmptyState') && has('guilt copy'))
  check('existing UI component variants audited',
    has('shadcn') && existsSync('src/components/ui/badge.tsx') &&
    existsSync('src/components/ui/card.tsx'))
}

// ── 9. Terminology and voice ─────────────────────────────────────────
console.log('\n9. Terminology and voice')
{
  check('approved terminology table present',
    has('| Term (approved) | Replaces / clarifies | Rule |'))
  const TERMS = ['Muscle readiness', 'Weekly review', 'Decision log', 'Follow-through',
    'Outcome', 'Target adjustment review', 'Calculated recommendation', 'Active targets',
    'Baseline weight', 'Latest weigh-in', 'Goal weight', 'Main goal', 'Latest measurement',
    'Needs follow-through', 'Suggested / Accepted / Applied / Dismissed']
  check('all required terms resolved', TERMS.every((t) => has(t)))
  check('voice principles defined',
    has('no guilt framing') || has('**no guilt framing**'))
  check('no causation claims rule', has('no causation claims') || has('**no causation claims**'))
  check('no medical language rule', has('no medical language') || has('**no medical language**'))
  check('actions-verbs / states-nouns rule',
    has('Actions use verbs') && has('nouns/past-tense'))
  check('document itself avoids guilt language',
    !/you failed|be ashamed|lazy|cheat day/i.test(doc))
  check('document itself avoids causal claims',
    !/caused your|because you ate|will make you lose/i.test(doc))
}

// ── 10. Accessibility ────────────────────────────────────────────────
console.log('\n10. Accessibility')
{
  check('severity table with all four levels',
    has('blocker / high / medium / low') || (has('| high |') && has('| medium |') && has('| low |')))
  check('keyboard requirements', has('Keyboard requirements'))
  check('focus requirements', has('visible focus'))
  check('contrast requirements with tooling caveat',
    has('4.5:1') && has('3:1'))
  check('chart accessibility documented',
    has('role="img"') && has('text summaries'))
  check('aria-live gap documented', has('aria-live'))
  check('no fake WCAG claim',
    has('No WCAG conformance is claimed') && !/WCAG\s+2\.\d\s+(AA\s+)?compliant/i.test(doc))
}

// ── 11. Performance and loading ──────────────────────────────────────
console.log('\n11. Performance and loading')
{
  check('performance audit present', has('## Part 11 — Performance and loading UX'))
  check('server/client boundaries documented',
    has('full client pages') && has('useEffect'))
  check('loading UX gaps documented',
    has('no skeletons anywhere') && has('page-blocking'))
  check('prioritized 4B/4C list present', has('**Prioritized for 4B/4C:**'))
}

// ── 12. Route decisions ──────────────────────────────────────────────
console.log('\n12. Route decisions')
{
  const DECISIONS = [
    ['Food vs Nutrition', 'Keep both routes'],
    ['Coach vs Check-in', 'Keep separate'],
    ['Decisions top-level', 'Demote'],
    ['Weigh-in under Progress', 'nav grouping only'],
    ['Activity its own route', 'Keep route, demote'],
    ['Fasting top-level', 'Demote + gate'],
    ['Workouts/Routines/Library', 'Keep tabs'],
    ['Profile split', 'Defer split'],
    ['Dashboard → Today', 'Rename label to "Today" in 4B'],
    ['Progress include Weekly Review', 'Weekly review stays under Coach'],
    ['Target adjustment location', 'Exclusively `/nutrition`'],
  ]
  for (const [q, a] of DECISIONS) {
    check(`decision: ${q}`, has(a))
  }
  check('decisions include benefit/cost/compatibility',
    has('User benefit / cost / compatibility') || has('benefit:'))
}

// ── 13. Phase plans ──────────────────────────────────────────────────
console.log('\n13. Phase 4B/4C plans')
{
  check('4B sequencing table with six subphases',
    ['4B.1 Foundation', '4B.2 Navigation', '4B.3 Daily surfaces',
      '4B.4 Training', '4B.5 Fuel', '4B.6 Setup'].every((s) => has(s)))
  check('4B route scope per subphase',
    has('| Subphase | Routes | Component families |'))
  check('4B checkpoints named',
    has('phase4b1-foundation-stable') && has('phase4b6-setup-stable'))
  check('4B regression risks and harness expectations per subphase',
    has('Regression risks') && has('Harness expectation'))
  check('ForgeFitOS rebrand deferred to 4B',
    has('ForgeFitOS rebrand') && (has('deferred to Phase 4B') || has('lands in 4B.1')))
  check('4C preference model defined',
    has('dashboard_layout JSONB') && has('user_profiles'))
  check('4C migration decision explicit',
    has('Migration required: yes') && has('014_phase4c_dashboard_layout.sql'))
  check('4C presets defined', has('Recommended default, Workout-only, Full system'))
  check('4C accessibility (accessible move controls before drag-and-drop)',
    has('accessible move controls') && has('never the only mechanism'))
  check('4C reset behavior', has('Reset to recommended'))
  check('4C new-widget grace', has('unknown ids') && has('ignored gracefully'))
}

// ── 14. Prioritization tables ────────────────────────────────────────
console.log('\n14. Prioritization')
{
  check('must-fix table', has('### A. Must fix in 4B'))
  check('should-fix table', has('### B. Should fix in 4B'))
  check('deferred table', has('### C. Defer until after 4C'))
  check('tables include severity/routes/impact/risk/phase',
    has('| Issue | Severity | Routes | User impact | Risk | Phase |'))
  check('dead-code issue documented and still real',
    has('fetchProgressSummary` has no callers') &&
    !readFileSync('src/app/(app)/progress/page.tsx', 'utf8').includes('fetchProgressSummary(') &&
    readFileSync('src/lib/progress-summary.ts', 'utf8').includes('duration_minutes'))
  check('.DS_Store backup exclusion documented and gitignore claim real',
    has('.DS_Store') && has('backup zips') &&
    readFileSync('.gitignore', 'utf8').includes('.DS_Store'))
}

// ── 15. Phase-boundary invariants (no production changes) ────────────
console.log('\n15. Phase boundary')
{
  check('no migration 014 added',
    !existsSync('supabase/migrations/014_phase4c_dashboard_layout.sql') &&
    !existsSync('supabase/migrations/014_phase3f.sql'))
  check('rebrand stayed surface-level (package/repo name never renamed)',
    (() => {
      // Phase 4A deferred the visible rebrand to 4B; Phase 4B.1 then
      // executed it as a brand shell only. The durable 4A invariant is
      // that the rebrand NEVER renames the package, repo, or routes.
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
      return pkg.name === 'shredos'
    })())
  check('no route renames (all 21 page files still present)',
    existsSync('src/app/(app)/dashboard/page.tsx') &&
    existsSync('src/app/(app)/check-in/page.tsx') &&
    !existsSync('src/app/(app)/today') && !existsSync('src/app/(app)/review'))
  check('no dependencies beyond the sanctioned set',
    (() => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
      const deps = Object.keys(pkg.dependencies)
      // The exact Phase 3E-era set, plus 'geist' — the single addition
      // Phase 4A decided on and Phase 4B.1 executed. Nothing else.
      const extras = deps.filter((d) => d === 'geist')
      return deps.length === 21 + extras.length && deps.includes('next') &&
        !deps.some((d) => /chart|dnd|framer/i.test(d))
    })())
  check('no target logic changes (goal-adjustments untouched)',
    readFileSync('src/lib/goal-adjustments.ts', 'utf8').includes('CALORIE_STEP_SMALL = 100'))
  check('no Coach logic changes',
    readFileSync('src/lib/coach-actions.ts', 'utf8').includes("title: 'Log a weigh-in this week'"))
  check('no Weekly Review logic changes',
    readFileSync('src/lib/weekly-review.ts', 'utf8').includes('PROGRESSION_LOOKBACK_DAYS = 56'))
  check('no decision model changes',
    readFileSync('src/lib/decisions.ts', 'utf8').includes("suggested: ['accepted', 'dismissed']"))
  check('no workout calculation changes',
    readFileSync('src/lib/workout.ts', 'utf8').includes('weightKg * (1 + reps / 30)'))
  check('no nutrition calculation changes',
    readFileSync('src/lib/nutrition.ts', 'utf8').includes('LEAN_MASS_PROTEIN_THRESHOLD'))
  check('user control principle preserved in the brief',
    has('User-control principle (binding)'))
  check('existing responsive behavior documented against reality',
    // The audit recorded the 4A-era single md split; the durable
    // invariant is that the shell keeps ONE coordinated split (moved
    // md -> lg by the 4B.2 responsive correction).
    has('one split') &&
    readFileSync('src/app/(app)/layout.tsx', 'utf8').includes('hidden lg:flex'))
  check('current global CSS audited (metric utilities noted)',
    has('metric-value') &&
    readFileSync('src/app/globals.css', 'utf8').includes('.metric-value'))
}

// ── 16. Document quality ─────────────────────────────────────────────
console.log('\n16. Document quality')
{
  check('document distinguishes current state from future recommendation',
    has('**Current') && has('**Future') && has('labeled **Current** describe'))
  check('document is actionable (subphase → routes → components mapping exists)',
    has('| **4B.1 Foundation**') || has('**4B.1 Foundation**'))
  check('formerly-open questions enumerated and resolved',
    has('## Resolved product decisions (formerly open questions'))
  check('document cites actual repository facts throughout',
    (doc.match(/src\/(app|components|lib)\//g) ?? []).length >= 15)
  check('no unicode escapes or mangled strings in the document',
    // Patterns built indirectly so this file itself never trips the
    // phase-level greps for the same artifacts.
    !doc.includes('\\' + 'u00') && !doc.includes('fat_' + 'lass'))
}

// ── 17. Resolved product decisions ───────────────────────────────────
console.log('\n17. Resolved product decisions')
{
  check('typography decided: Geist Sans as the single variable family',
    has('**Geist Sans** is the single variable interface family'))
  check('Geist license documented', has('SIL Open Font License 1.1'))
  check('Geist Mono restricted to rare utility contexts',
    has('Geist Mono') && has('not** a general second family'))
  check('font decision honored: Geist Sans is the only font package',
    has('no font package is added or loaded in Phase 4A') &&
    (() => {
      // 4A decided Geist Sans (deferred install); 4B.1 installed it.
      // The durable invariant: 'geist' is the ONLY font-related
      // package, and no second family is loaded in the root layout.
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
      const fontDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
        .filter((d) => /geist|font/i.test(d))
      const layout = readFileSync('src/app/layout.tsx', 'utf8')
      return fontDeps.length <= 1 && (fontDeps.length === 0 || fontDeps[0] === 'geist') &&
        !layout.includes('GeistMono')
    })())
  check('brand accent decided: mint/teal retained and de-overloaded',
    has('mint/teal brand family is retained'))
  check('semantic color separation mapping decided',
    has('**green** — success') && has('**amber** — caution/recovery') &&
    has('**red** — destructive/critical') &&
    has('**blue or violet** — informational/data context') &&
    has('**neutrals** — structure'))
  check('selection/status never color-alone (decided)',
    has('never rely on color alone'))
  check('mobile slots decided: Today / Train / Fuel / Progress / Coach',
    has('exactly **Today / Train / Fuel / Progress / Coach**'))
  check('Profile decided into the More/settings surface',
    has('Profile belongs in the More/settings surface'))
  check('utility routes reachable via contextual navigation or More',
    has('Decisions, Weigh-in, Activity, Fasting, Saved meals'))
  check('profile logging policy decided (log list)',
    has('**Log:** main goal, goal weight, activity level, baseline weight, body-fat fallback, height or age when changed, step goal, weigh-in schedule, fasting preference/default'))
  check('profile logging policy decided (do-not-log list)',
    has('display-name-only changes') && has('unchanged saves') &&
    has('latest weigh-ins as profile changes'))
  check('consolidated multi-field decision rule decided',
    has('one consolidated Applied decision'))
  check('label renames approved with URLs unchanged through 4C',
    has('Dashboard → Today') && has('Check-in → Weekly review') &&
    has('URLs unchanged through Phase 4C') &&
    has('No redirects or route renames in 4A or 4B') ||
    has('no redirects or route renames in 4A or 4B'))
  check('open-question section fully resolved',
    has('all five RESOLVED by product approval') &&
    has('No open questions remain for Phase 4B') &&
    !has('## Open questions requiring user/product decisions'))
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
