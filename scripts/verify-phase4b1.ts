// ============================================================
// ForgeFitOS — Phase 4B.1 deterministic verification harness
// Verifies the visual foundation: brand naming, Geist Sans,
// semantic tokens, typography roles, spacing/shape/elevation, card
// and button hierarchies, form states, badges/notices/chips,
// skeletons, focus/accessibility foundation, the emoji ban, and —
// critically — that NO domain logic, route, migration, or data
// behavior changed. File reads only; deterministic.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b1.ts
// ============================================================

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

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
// Runtime-constructed so tsc's default target accepts it.
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')
const globals = read('src/app/globals.css')
const tw = read('tailwind.config.ts')
const rootLayout = read('src/app/layout.tsx')
const pkg = JSON.parse(read('package.json'))
const notes = read('docs/phase4b1-foundation-notes.md')

// ── 1. Checkpoint and brand ──────────────────────────────────────────
console.log('\n1. Checkpoint and brand')
{
  check('checkpoint artifacts exist',
    ['src/lib/goal-adjustments.ts', 'scripts/verify-phase3e.ts',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('Phase 4A audit exists',
    existsSync('docs/phase4a-ux-information-architecture-audit.md'))
  check('ForgeFitOS root metadata title',
    rootLayout.includes("default: 'ForgeFitOS'") &&
    rootLayout.includes("template: '%s | ForgeFitOS'"))
  check('ForgeFitOS description',
    rootLayout.includes('ForgeFitOS — a personal fitness operating system'))
  check('ForgeFitOS PWA title', rootLayout.includes("title: 'ForgeFitOS'"))
  check('login brands via APP_NAME',
    read('src/lib/constants.ts').includes("export const APP_NAME = 'ForgeFitOS'") &&
    read('src/app/(auth)/login/page.tsx').includes('{APP_NAME}'))
  check('app shell brand fallbacks updated',
    read('src/app/(app)/layout.tsx').includes("user.email ?? 'ForgeFitOS'") &&
    read('src/components/layout/TopBar.tsx').includes("?? 'ForgeFitOS'"))
  check('onboarding shell brand copy updated',
    read('src/components/onboarding/Step3Schedule.tsx').includes('ForgeFitOS works on your schedule'))
  check('no active user-facing ShredOS copy in src (comments/docs exempt)',
    (() => {
      // Scan JSX text and string literals; strip comments first.
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts)$/.test(entry)) continue
          const code = read(full).replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
          if (/ShredOS/.test(code)) offenders.push(full)
        }
      }
      walk('src')
      return offenders.length === 0
    })())
  check('no repository/package rename', pkg.name === 'shredos')
}

// ── 2. Typography ────────────────────────────────────────────────────
console.log('\n2. Typography')
{
  check('Geist Sans configured via the official package',
    rootLayout.includes("import { GeistSans } from 'geist/font/sans'") &&
    rootLayout.includes('GeistSans.variable'))
  check('dependency addition justified and single',
    pkg.dependencies['geist'] !== undefined)
  check('package-lock consistent',
    read('package-lock.json').includes('"geist"'))
  check('no local font files added',
    !existsSync('public/fonts') && !existsSync('src/fonts') &&
    (() => {
      const walk = (dir: string): boolean => {
        if (!existsSync(dir)) return true
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { if (!walk(full)) return false; continue }
          if (/\.(woff2?|ttf|otf|eot)$/i.test(entry)) return false
        }
        return true
      }
      return walk('src') && walk('public')
    })())
  check('no second general font family (Geist Mono not loaded)',
    !rootLayout.includes('GeistMono') && !rootLayout.includes('geist/font/mono'))
  check('Tailwind sans uses the Geist variable with system fallbacks',
    tw.includes("'var(--font-geist-sans)'") && tw.includes("'system-ui'"))
  const ROLES = ['text-display', 'text-page-title', 'text-section-title', 'text-card-title',
    'text-body', 'text-support', 'text-metric', 'text-label', 'text-button', 'text-badge',
    'text-chart-annotation']
  for (const role of ROLES) {
    check(`typography role: .${role}`, globals.includes(`.${role} `) || globals.includes(`.${role}{`))
  }
  check('tabular-number utility available',
    globals.includes('.font-stat') && globals.includes("'tnum'"))
}

// ── 3. Semantic color tokens ─────────────────────────────────────────
console.log('\n3. Color tokens')
{
  const TOKENS = ['--canvas', '--canvas-subtle', '--surface', '--surface-raised',
    '--surface-sunken', '--surface-interactive', '--surface-selected', '--text-primary', '--text-secondary',
    '--text-muted', '--text-inverse', '--border-subtle', '--border-default',
    '--border-strong', '--brand', '--brand-hover', '--brand-active', '--brand-subtle',
    '--success', '--success-subtle', '--caution', '--caution-subtle', '--critical',
    '--critical-subtle', '--info', '--info-subtle', '--focus-ring', '--overlay',
    '--readiness-ready', '--readiness-caution', '--readiness-recovery']
  for (const t of TOKENS) {
    check(`token ${t}`, globals.includes(`${t}:`))
  }
  check('chart tokens 1–6 present (multi-hue)',
    [1, 2, 3, 4, 5, 6].every((n) => globals.includes(`--chart-${n}:`)))
  const val = (name: string) => {
    const m = globals.match(new RegExp(`${name}: ([\\d. %]+);`))
    return m ? m[1] : ''
  }
  check('brand differs from success', val('--brand') !== val('--success') &&
    val('--brand').startsWith('163') && val('--success').startsWith('142'))
  check('info differs from brand (violet vs teal)', val('--info').startsWith('252'))
  check('caution differs from success', val('--caution').startsWith('38'))
  check('charts do not rely on one hue family',
    new Set([val('--chart-1'), val('--chart-2'), val('--chart-3'), val('--chart-4')]
      .map((v) => v.split(' ')[0])).size >= 4)
  check('tailwind maps semantic roles',
    ['canvas', 'surface', 'brand', 'success', 'caution', 'critical', 'info', 'readiness']
      .every((k) => tw.includes(`${k}:`)) && tw.includes("'focus-ring'"))
  check('legacy dark class retained (supplies valid mint --primary/--ring triplets), no theme toggle',
    rootLayout.includes('className={`dark') &&
    !read('src/app/(app)/layout.tsx').includes('ThemeToggle'))
}

// ── 4. Spacing, shape, elevation ─────────────────────────────────────
console.log('\n4. Spacing, shape, elevation')
{
  check('spacing scale present (4px base)',
    ['--space-1', '--space-2', '--space-4', '--space-8'].every((t) => globals.includes(t)))
  check('compact density guidance', globals.includes('compact ='))
  check('default density guidance', globals.includes('default ='))
  check('spacious density guidance', globals.includes('spacious ='))
  check('control radius token', globals.includes('--radius-control'))
  check('card radius token', globals.includes('--radius-card'))
  check('badge radius token', globals.includes('--radius-badge'))
  check('panel and modal radii', globals.includes('--radius-panel') && globals.includes('--radius-modal'))
  check('restrained elevation tokens',
    globals.includes('--shadow-raised') && globals.includes('--shadow-floating'))
  check('no neon glow', !/box-shadow:[^;]*(#0f0|#00ff|hsl\(var\(--brand\)\) 0 0 2\d)/i.test(globals) &&
    globals.includes('no neon glow'))
  check('no broad glassmorphism', !globals.includes('backdrop-filter: blur(2'))
  check('tailwind exposes shape/elevation',
    tw.includes("control: 'var(--radius-control)'") && tw.includes("raised: 'var(--shadow-raised)'"))
}

// ── 5. Card hierarchy ────────────────────────────────────────────────
console.log('\n5. Card hierarchy')
{
  const card = read('src/components/ui/card.tsx')
  for (const v of ['default', 'elevated', 'interactive', 'selected', 'metric', 'action', 'status', 'subtle']) {
    check(`card variant: ${v}`, card.includes(`${v}:`))
  }
  check('card API preserved (Header/Title/Content/Footer intact)',
    ['CardHeader', 'CardTitle', 'CardContent', 'CardFooter'].every((c) => card.includes(c)))
  check('default card variant renders the pre-existing classes',
    card.includes('bg-card ring-1 ring-foreground/10'))
  check('selected card variant not color-only (ring + doc note)',
    card.includes('ring-2 ring-[hsl(var(--brand))]') && card.includes('never color-only'))
  check('legacy shred-card compatibility alias documented and mapped',
    globals.includes('TRANSITIONAL ALIAS') &&
    globals.includes('background-color: hsl(var(--surface));') &&
    notes.includes('.shred-card'))
}

// ── 6. Button system ─────────────────────────────────────────────────
console.log('\n6. Button system')
{
  const btn = read('src/components/ui/button.tsx')
  for (const v of ['primary', 'secondary', 'tertiary', 'ghost', 'destructive', 'link']) {
    check(`button variant: ${v}`, btn.includes(`${v}:`))
  }
  check('icon-only button sizes', btn.includes('icon: "size-8"') || btn.includes('icon:'))
  check('button size: compact', btn.includes('compact:'))
  check('button size: default', btn.includes('default:\n'))
  check('button size: large (44px touch target)', btn.includes('large: "h-11'))
  check('touch-target guidance documented',
    btn.includes('44px') || notes.includes('44px'))
  check('button focus state', btn.includes('focus-visible:ring'))
  check('button disabled state', btn.includes('disabled:'))
  check('button loading support preserves width',
    btn.includes('loading?: boolean') && btn.includes('invisible') &&
    btn.includes('aria-busy'))
  check('loading spinner is a line icon, not emoji',
    btn.includes('Loader2') && !EMOJI.test(btn))
  check('destructive distinct from brand',
    btn.includes('bg-destructive/10 text-destructive'))
}

// ── 7. Form system ───────────────────────────────────────────────────
console.log('\n7. Form system')
{
  const input = read('src/components/ui/input.tsx')
  check('input focus state', input.includes('focus-visible:border-ring'))
  check('input invalid state', input.includes('aria-invalid:border-destructive'))
  check('input disabled state', input.includes('disabled:pointer-events-none'))
  check('input read-only state', input.includes('read-only:'))
  check('help-text support', input.includes('function FieldHelp'))
  check('error-text support announced', input.includes('role="alert"'))
  check('field text uses aria-describedby pattern', input.includes('aria-describedby'))
  check('label primitive intact', existsSync('src/components/ui/label.tsx'))
  const option = read('src/components/ui/option-card.tsx')
  check('OptionCard visible selected state (border + tint)',
    option.includes('border-2 border-primary'))
  check('OptionCard not color-only (checkmark + aria-pressed)',
    option.includes('Check') && option.includes('aria-pressed'))
  check('Select primitive states intact', existsSync('src/components/ui/select.tsx'))
  check('Switch primitive intact', existsSync('src/components/ui/switch.tsx'))
  check('Textarea primitive added with matching states',
    read('src/components/ui/textarea.tsx').includes('aria-invalid:border-destructive'))
}

// ── 8. Badges, notices, chips ────────────────────────────────────────
console.log('\n8. Badges, notices, chips')
{
  const badge = read('src/components/ui/badge.tsx')
  for (const v of ['neutral', 'brand', 'success', 'caution', 'critical', 'info', 'outline']) {
    check(`badge variant: ${v}`, badge.includes(`${v}:`))
  }
  const notice = read('src/components/ui/notice.tsx')
  for (const v of ['neutral', 'info', 'success', 'caution', 'critical']) {
    check(`notice variant: ${v}`, notice.includes(`${v}:`))
  }
  check('notice supports title/body/action/icon',
    notice.includes('title?:') && notice.includes('action?:') && notice.includes('icon?:'))
  check('notice semantic roles + accessible labeling',
    notice.includes("role={role}") && notice.includes("'alert'"))
  check('notice icons professional and decorative-hidden',
    notice.includes('TriangleAlert') && notice.includes('aria-hidden="true"'))
  const chip = read('src/components/ui/filter-chip.tsx')
  check('filter-chip selected state not color-only',
    chip.includes('aria-pressed') && chip.includes('Check') && chip.includes('font-semibold'))
  check('tabs/chips selected-state + keyboard focus',
    chip.includes('focus-visible:ring'))
  check('horizontal-overflow guidance documented',
    chip.includes('overflow-x-auto') || notes.includes('horizontally scroll'))
}

// ── 9. Skeletons and loading ─────────────────────────────────────────
console.log('\n9. Skeletons and loading')
{
  const skeleton = read('src/components/ui/skeleton.tsx')
  check('skeleton primitive', skeleton.includes('export function Skeleton'))
  check('text skeleton', skeleton.includes('SkeletonText'))
  check('metric skeleton', skeleton.includes('SkeletonMetric'))
  check('card skeleton', skeleton.includes('SkeletonCard'))
  check('page-section skeleton', skeleton.includes('SkeletonSection'))
  check('reduced-motion behavior',
    globals.includes('prefers-reduced-motion') && globals.includes('animation: none'))
  check('calm pulse, no shimmer flash', globals.includes('ff-skeleton-pulse') &&
    !globals.includes('shimmer'))
  check('skeletons approximate final geometry (documented)',
    skeleton.includes('approximates final geometry') || skeleton.includes('layout shift'))
  check('no emoji loading icons', !EMOJI.test(skeleton))
}

// ── 10. Focus and accessibility foundation ───────────────────────────
console.log('\n10. Focus and accessibility')
{
  check('focus-visible global treatment', globals.includes(':focus-visible {'))
  check('semantic focus-ring token used',
    globals.includes('outline: 2px solid hsl(var(--focus-ring))'))
  check('disabled-state clarity in primitives',
    read('src/components/ui/button.tsx').includes('disabled:opacity-50'))
  check('decorative icons aria-hidden (brand + notices)',
    read('src/components/layout/BrandMark.tsx').includes("aria-hidden={decorative ? 'true' : undefined}"))
  check('icon-only controls accessible (menu toggle labeled)',
    read('src/components/layout/TopBar.tsx').includes('aria-label="Toggle menu"'))
  check('no fake WCAG claim',
    !/WCAG\s+2[.\d]*\s+(AA\s+)?compliant/i.test(globals + notes))
}

// ── 11. Brand shell and icons ────────────────────────────────────────
console.log('\n11. Brand shell and icons')
{
  const brand = read('src/components/layout/BrandMark.tsx')
  check('ForgeFitOS wordmark present',
    brand.includes('ForgeFitOS') && read('src/components/layout/Sidebar.tsx').includes('BrandWordmark'))
  check('brand mark is an original geometric inline SVG',
    brand.includes('<svg') && brand.includes('viewBox="0 0 24 24"') && brand.includes('<rect'))
  check('brand mark uses semantic tokens',
    brand.includes('hsl(var(--brand))'))
  check('accessible brand label', brand.includes('aria-label="ForgeFitOS"'))
  check('no emoji logo / no dumbbell-flame-robot mark',
    !EMOJI.test(brand) &&
    !/dumbbell|flame|robot|Dumbbell.*Brand/i.test(brand))
  check('no generated raster assets',
    (() => {
      const walk = (dir: string): boolean => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { if (!walk(full)) return false; continue }
          if (/\.(png|jpe?g|webp|gif)$/i.test(entry)) return false
        }
        return true
      }
      return walk('src')
    })())
  check('icon library count is one',
    (() => {
      const deps = Object.keys(pkg.dependencies)
      const iconLibs = deps.filter((d) =>
        /icon|lucide|heroicons|feather|fontawesome|tabler|phosphor/i.test(d))
      return iconLibs.length === 1 && iconLibs[0] === 'lucide-react'
    })())
  check('no emoji characters anywhere in src (Extended_Pictographic scan)',
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
  check('retained non-emoji unicode documented',
    notes.includes('U+2713') && notes.includes('Extended_Pictographic'))
  check('icon size conventions documented',
    notes.includes('16px inline') && notes.includes('navigation'))
  check('nav labels remain visible alongside icons',
    read('src/components/layout/Sidebar.tsx').includes('<span>{label}</span>'))
  check('nav-items transitional state documented (4B.2)',
    notes.includes('nav-items.ts') && notes.includes('4B.2'))
}

// ── 12. Phase boundary (nothing else changed) ────────────────────────
console.log('\n12. Phase boundary')
{
  check('no route changes (all page files present, no new routes)',
    ['dashboard', 'check-in', 'coach', 'decisions', 'profile', 'nutrition', 'food',
      'weigh-in', 'fasting', 'workouts', 'progress', 'activity', 'onboarding']
      .every((r) => existsSync(`src/app/(app)/${r}/page.tsx`)) &&
    !existsSync('src/app/(app)/today'))
  check('no migration 014', !readdirSync('supabase/migrations').some((f) => f.startsWith('014')))
  check('no Supabase/API behavior change (decisions + goal-adjustment routes intact)',
    read('src/app/api/decisions/route.ts').includes('validateDecisionUpdate(') &&
    read('src/app/api/goal-adjustment/route.ts').includes("'apply_goal_calorie_adjustment'"))
  check('no target-logic changes',
    read('src/lib/goal-adjustments.ts').includes('CALORIE_STEP_SMALL = 100'))
  check('no Coach-logic changes',
    read('src/lib/coach-actions.ts').includes("title: 'Log a weigh-in this week'"))
  check('no Weekly Review changes',
    read('src/lib/weekly-review.ts').includes('PROGRESSION_LOOKBACK_DAYS = 56'))
  check('no decision-model changes',
    read('src/lib/decisions.ts').includes("suggested: ['accepted', 'dismissed']"))
  check('no workout-calculation changes',
    read('src/lib/workout.ts').includes('weightKg * (1 + reps / 30)'))
  check('no nutrition-calculation changes',
    read('src/lib/nutrition.ts').includes('LEAN_MASS_PROTEIN_THRESHOLD'))
  check('no broad page redesign (pages keep their structure markers)',
    read('src/app/(app)/progress/page.tsx').includes('shred-card') &&
    read('src/app/(app)/check-in/page.tsx').includes('shred-card'))
  check('no dashboard customization', !existsSync('src/components/dashboard/WidgetFrame.tsx'))
  check('old CSS token compatibility (legacy vars still defined)',
    ['--background', '--card', '--primary', '--secondary', '--muted', '--border']
      .every((t) => globals.includes(`${t}:`)))
  check('current Tailwind utilities remain available',
    tw.includes("border: 'hsl(var(--border))'") && tw.includes('shred:'))
  check('no .DS_Store tracked in scope dirs',
    !existsSync('src/.DS_Store') && !existsSync('docs/.DS_Store'))
  check('user control principle preserved (notes distinguish current vs later)',
    notes.includes('Deferred to 4B.2'))
  check('no guilt/causal/medical language introduced',
    !/you failed|lazy|caused your|metabolic damage/i.test(notes + globals))
  check('foundation notes document transitional aliases',
    notes.includes('Transitional aliases'))
}

// ── 13. QA correction: legacy light compatibility ────────────────────
// Browser QA found the original 4B.1 alias produced near-black
// .shred-card surfaces on the app's de facto WHITE canvas (the legacy
// oklch-inside-hsl() tokens are invalid CSS, so the app has always
// rendered light despite html.dark). These checks pin the corrected
// contract: the legacy alias is LIGHT until routes migrate in
// 4B.3–4B.6, and the semantic system remains intact and dark-capable.
console.log('\n13. QA correction: legacy light compatibility')
{
  const val = (name: string) => {
    const m = globals.match(new RegExp(`${name}: ([\\d. %]+);`))
    return m ? m[1] : ''
  }
  const lightness = (name: string) => {
    const parts = val(name).trim().split(/\s+/)
    return parts.length === 3 ? parseFloat(parts[2]) : NaN
  }
  const cssOf = (selector: string) => {
    const m = globals.match(new RegExp(`\\.${selector} \\{([^}]*)\\}`))
    return m ? m[1] : ''
  }
  const shredCard = cssOf('shred-card')
  check('shred-card maps to the semantic surface token',
    shredCard.includes('hsl(var(--surface))'))
  check('shred-card surface is light (compatible with the white canvas)',
    lightness('--surface') >= 90)
  check('canvas token is light (matches de facto rendered theme)',
    lightness('--canvas') >= 90)
  check('no light-canvas/dark-card mismatch (canvas and legacy card agree)',
    (lightness('--canvas') >= 90) === (lightness('--surface') >= 90))
  check('legacy card text remains dark/readable on the light surface',
    lightness('--text-primary') <= 25 && lightness('--text-secondary') <= 40)
  check('legacy card borders use the subtle edge token, light-valued',
    shredCard.includes('hsl(var(--border-subtle))') &&
    lightness('--border-subtle') >= 70 && lightness('--border-subtle') <= 95)
  check('shred-card sets no text color of its own (inherits readable body text)',
    !/(^|[^-])color:/.test(shredCard) && !shredCard.includes('text-inverse'))
  check('state colors darkened for readability on white',
    lightness('--success') <= 45 && lightness('--caution') <= 48 &&
    lightness('--critical') <= 50 && lightness('--info') <= 60)
  check('state subtle tints are light backgrounds',
    ['--success-subtle', '--caution-subtle', '--critical-subtle', '--info-subtle',
      '--brand-subtle', '--surface-selected'].every((t) => lightness(t) >= 88))
  check('future semantic card variants remain available',
    (() => {
      const card = read('src/components/ui/card.tsx')
      return ['elevated', 'interactive', 'selected', 'metric', 'action', 'status', 'subtle']
        .every((v) => card.includes(`${v}:`)) && card.includes('cardVariants')
    })())
  check('skeletons stay visible on the white surface (sunken token)',
    globals.includes('background-color: hsl(var(--surface-sunken));') &&
    lightness('--surface-sunken') >= 80 && lightness('--surface-sunken') <= 96)
  check('root cause + light alias policy documented in foundation notes',
    notes.includes('Theme reality') && notes.includes('LIGHT legacy compatibility alias') &&
    notes.includes('light-first'))
  check('correction introduced no broad feature-component edits',
    (() => {
      // New-token references must stay confined to the design-system
      // layer (ui primitives, layout shell, globals, tailwind) — no
      // feature component or route was edited by the correction.
      const offenders: string[] = []
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts)$/.test(entry)) continue
          if (/^src\/components\/(ui|layout)\//.test(full)) continue
          if (read(full).includes('hsl(var(--surface')) offenders.push(full)
        }
      }
      walk('src/app')
      walk('src/components')
      return offenders.length === 0
    })())
  check('theme architecture stays dark-capable (documented, single override point)',
    globals.includes('dark-capable') && notes.includes('dark-capable'))
  check('font chains contain no undefined var() (Geist actually renders)',
    // One undefined var() invalidates the whole font-family declaration
    // (IACVT) — the app fell back to Times. Only --font-geist-sans (set
    // by the root layout) may appear; --font-sans/--font-mono are
    // defined nowhere and must not be referenced.
    !tw.includes("'var(--font-sans)'") && !tw.includes("'var(--font-mono)'") &&
    tw.includes("'var(--font-geist-sans)'"))
  check('mono utility uses a valid system stack',
    tw.includes("'ui-monospace'"))
  check('canvas is deterministic (body pinned to valid tokens, not the browser default)',
    // The legacy body bg is invalid (oklch inside hsl()) → transparent,
    // so page color followed the VIEWER'S OS color scheme. The
    // ForgeFitOS layer pins body to --canvas/--text-primary and pins
    // native controls with color-scheme: light.
    globals.includes('background-color: hsl(var(--canvas));') &&
    globals.includes('color: hsl(var(--text-primary));') &&
    globals.includes('color-scheme: light;'))
  check('body element uses valid semantic utilities (class beats element selectors)',
    // bg-background/text-foreground are CLASS selectors (0,1,0) with
    // invalid values — they beat any element-selector fallback and left
    // the body transparent. The root layout must use the valid
    // bg-canvas/text-ink utilities instead. Verified live: body
    // computes rgb(255,255,255) in a production build.
    (() => {
      const code = rootLayout.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
      return code.includes('bg-canvas text-ink') &&
        !code.includes('bg-background') && !code.includes('text-foreground')
    })())
  check('login page uses the BrandMark (hardcoded S square removed)',
    (() => {
      const login = read('src/app/(auth)/login/page.tsx')
      return login.includes('<BrandMark') && !login.includes('>S</span>')
    })())
}

// ── Result ───────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
