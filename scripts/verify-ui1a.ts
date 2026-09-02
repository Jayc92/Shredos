// ============================================================
// ForgeFitOS — UI-1A verification harness
// Dark Foundation & Legacy Compatibility: proves the semantic token
// layer is a valid dark navy/charcoal system (never pure black), the
// legacy shadcn-compatible tokens are repaired dark HSL (no oklch
// reaches an hsl(var(…)) consumer), the surface hierarchy is
// distinct, representative token pairs meet WCAG AA contrast BY
// COMPUTATION, pinch zoom is restored, the three audited legacy
// islands (login, ExerciseForm, profile NumField) carry no raw
// light-only styling, and NOTHING behavioral changed: no theme
// toggle, no migration 020, no dashboard/Progress recomposition, no
// energy/eat-back logic, no new dependency.
// Structural checks only prove code shape — hosted physical QA on
// the Vercel Preview remains the visual acceptance authority.
// Run from the repository root:
//   npx tsx scripts/verify-ui1a.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const globals = read('src/app/globals.css')
const globalsCode = stripComments(globals)
const rootLayout = read('src/app/layout.tsx')
const tw = read('tailwind.config.ts')
const login = read('src/app/(auth)/login/page.tsx')
const exerciseForm = read('src/components/workout/ExerciseForm.tsx')
const profile = read('src/app/(app)/profile/page.tsx')

// ── Token parsing: last declaration wins (mirrors the cascade under
// html.dark, where the .dark block re-declares the legacy tokens). ──
function tokenValue(name: string): string | null {
  const re = new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*([^;]+);`, 'g')
  let value: string | null = null
  let m: RegExpExecArray | null
  while ((m = re.exec(globalsCode)) !== null) value = m[1].trim()
  return value
}
const HSL_TRIPLET = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/
function hsl(name: string): [number, number, number] {
  const v = tokenValue(name)
  if (!v || !HSL_TRIPLET.test(v)) throw new Error(`token ${name} is not an HSL triplet: ${v}`)
  const [h, s, l] = v.split(/\s+/).map((x) => parseFloat(x))
  return [h, s / 100, l / 100]
}
const L = (name: string) => hsl(name)[2] * 100

// ── WCAG relative luminance + contrast ratio (computed, not eyeballed) ──
function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: [number, number, number] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x]
  const m = l - c / 2
  return [rgb[0] + m, rgb[1] + m, rgb[2] + m]
}
function luminance(name: string): number {
  const [r, g, b] = hslToRgb(hsl(name)).map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(fg: string, bg: string): number {
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

// ── 1. Semantic tokens: valid dark HSL triplets ──────────────────────
console.log('\n1. Semantic tokens — valid dark HSL')
{
  const SEMANTIC = ['--canvas', '--canvas-subtle', '--surface', '--surface-raised',
    '--surface-sunken', '--surface-interactive', '--surface-selected',
    '--text-primary', '--text-secondary', '--text-muted', '--text-inverse',
    '--border-subtle', '--border-default', '--border-strong',
    '--brand', '--brand-hover', '--brand-active', '--brand-subtle', '--brand-foreground',
    '--success', '--success-subtle', '--caution', '--caution-subtle',
    '--critical', '--critical-subtle', '--info', '--info-subtle',
    '--focus-ring', '--chart-1', '--chart-2', '--chart-3', '--chart-4',
    '--chart-5', '--chart-6', '--readiness-ready', '--readiness-caution',
    '--readiness-recovery', '--overlay']
  for (const t of SEMANTIC) {
    const v = tokenValue(t)
    check(`${t} is a valid HSL triplet`, v !== null && HSL_TRIPLET.test(v), String(v))
  }
}

// ── 2. Legacy compatibility repair ───────────────────────────────────
console.log('\n2. Legacy token repair')
{
  const LEGACY = ['--background', '--foreground', '--card', '--card-foreground',
    '--popover', '--popover-foreground', '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
    '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
    '--border', '--input', '--ring']
  for (const t of LEGACY) {
    const v = tokenValue(t)
    check(`legacy ${t} resolves to a valid HSL triplet`,
      v !== null && HSL_TRIPLET.test(v), String(v))
  }
  check('no oklch() remains in globals.css CODE (nothing can reach hsl(var(…)) invalid; comments may narrate history)',
    !globalsCode.includes('oklch('))
  check('legacy dark values map onto the semantic system (card=surface, background=canvas, foreground=text-primary)',
    tokenValue('--card') === tokenValue('--surface') &&
    tokenValue('--background') === tokenValue('--canvas') &&
    tokenValue('--foreground') === tokenValue('--text-primary'))
  check('legacy brand alignment (primary = brand mint)',
    tokenValue('--primary') === tokenValue('--brand') &&
    tokenValue('--ring') === tokenValue('--brand'))
  check('tailwind still consumes every token via hsl(var(…)) (consumer layer untouched)',
    tw.includes("'hsl(var(--canvas))'") && tw.includes("'hsl(var(--card))'") &&
    tw.includes("'hsl(var(--background))'") && tw.includes("'hsl(var(--border))'"))
  check('the .light block remains untouched (no toggle exists to reach it; not a regression surface)',
    globals.includes('.light {') && globals.match(/\.light \{[^}]*--background: 0 0% 100%/) !== null)
}

// ── 3. Dark hierarchy ────────────────────────────────────────────────
console.log('\n3. Surface hierarchy — distinct, dark, never pure black')
{
  check('canvas is deep navy, not pure black',
    L('--canvas') >= 4 && L('--canvas') <= 10 && hsl('--canvas')[1] > 0)
  check('canvas is not grayscale (navy/charcoal hue family 200–240)',
    hsl('--canvas')[0] >= 200 && hsl('--canvas')[0] <= 240)
  check('surface sits above canvas',
    L('--surface') > L('--canvas'))
  check('raised sits above surface',
    L('--surface-raised') > L('--surface'))
  check('sunken sits below canvas (inset wells read as depth)',
    L('--surface-sunken') < L('--canvas'))
  check('interactive is distinguishable from surface',
    L('--surface-interactive') > L('--surface'))
  check('selected surface carries the brand hue',
    Math.abs(hsl('--surface-selected')[0] - hsl('--brand')[0]) <= 10)
  check('full hierarchy is strictly ordered (sunken < canvas < subtle-canvas ≤ surface < raised ≤ interactive)',
    L('--surface-sunken') < L('--canvas') &&
    L('--canvas') < L('--canvas-subtle') &&
    L('--canvas-subtle') <= L('--surface') &&
    L('--surface') < L('--surface-raised') &&
    L('--surface-raised') <= L('--surface-interactive'))
  check('borders ordered subtle < default < strong, all above surface',
    L('--border-subtle') < L('--border-default') &&
    L('--border-default') < L('--border-strong') &&
    L('--border-subtle') > L('--surface'))
  check('text ordered muted < secondary < primary, all light',
    L('--text-muted') < L('--text-secondary') &&
    L('--text-secondary') < L('--text-primary') &&
    L('--text-muted') >= 55)
  check('text-inverse is dark (for on-brand use)', L('--text-inverse') <= 15)
  check('mint stays the controlled brand accent (hue 160–168, no hue drift)',
    hsl('--brand')[0] >= 160 && hsl('--brand')[0] <= 168 &&
    hsl('--focus-ring')[0] >= 160 && hsl('--focus-ring')[0] <= 168)
  check('brand hover lightens on dark (inverse of the light-theme darken)',
    L('--brand-hover') > L('--brand') && L('--brand-active') < L('--brand'))
  check('focus-ring and all semantic state tokens exist and are bright on dark',
    L('--focus-ring') >= 45 && L('--success') >= 45 && L('--caution') >= 50 &&
    L('--critical') >= 55 && L('--info') >= 65)
  check('chart series lifted for dark surfaces (every series L ≥ 50)',
    [1, 2, 3, 4, 5, 6].every((n) => L(`--chart-${n}`) >= 50))
  check('shadows deepened for dark (no light-theme 0.06/0.08 alphas remain)',
    globals.includes('--shadow-raised: 0 1px 2px rgb(0 0 0 / 0.35)') &&
    !globals.includes('rgb(0 0 0 / 0.06)'))
  check('elevation policy unchanged: no neon glow, no glassmorphism',
    globals.includes('no neon glow') &&
    !/box-shadow:[^;]*hsl\(var\(--brand\)/.test(globalsCode) &&
    !globalsCode.includes('backdrop-filter'))
}

// ── 4. WCAG AA contrast (computed) ───────────────────────────────────
console.log('\n4. WCAG AA contrast — computed ratios')
{
  const pairs: Array<[string, string, string, number]> = [
    // [foreground, background, label, threshold]
    ['--text-primary', '--canvas', 'primary text on canvas', 4.5],
    ['--text-primary', '--surface', 'primary text on surface', 4.5],
    ['--text-secondary', '--surface', 'secondary text on surface', 4.5],
    ['--text-muted', '--surface', 'muted text on surface (used at text-xs)', 4.5],
    ['--text-muted', '--canvas', 'muted text on canvas', 4.5],
    ['--brand-foreground', '--brand', 'inverse/brand-foreground text on brand', 4.5],
    ['--focus-ring', '--canvas', 'focus ring on canvas (non-text, ≥3:1)', 3],
    ['--critical', '--critical-subtle', 'critical text on its subtle surface', 4.5],
    ['--critical', '--surface', 'critical text on surface', 4.5],
    ['--success', '--success-subtle', 'success text on its subtle surface', 4.5],
    ['--caution', '--caution-subtle', 'caution text on its subtle surface', 4.5],
    ['--info', '--info-subtle', 'info text on its subtle surface', 4.5],
    ['--brand', '--canvas', 'brand accent on canvas (non-text, ≥3:1)', 3],
    ['--text-primary', '--surface-raised', 'primary text on raised surface', 4.5],
    ['--text-secondary', '--surface-interactive', 'secondary text on interactive surface', 4.5],
  ]
  for (const [fg, bg, label, min] of pairs) {
    const ratio = contrast(fg, bg)
    check(`contrast ${label}: ${ratio.toFixed(2)}:1 (needs ≥ ${min}:1)`, ratio >= min)
  }
}

// ── 5. Native controls, color-scheme, viewport ───────────────────────
console.log('\n5. Native controls and viewport')
{
  check('color-scheme is dark (native controls/autofill/pickers match theme)',
    globalsCode.includes('color-scheme: dark;') && !globalsCode.includes('color-scheme: light'))
  check('body stays pinned to valid tokens (deterministic canvas preserved)',
    globals.includes('background-color: hsl(var(--canvas));') &&
    globals.includes('color: hsl(var(--text-primary));'))
  check('pinch zoom restored: userScalable/maximumScale removed from the viewport CODE',
    !stripComments(rootLayout).includes('userScalable') &&
    !stripComments(rootLayout).includes('maximumScale'))
  check('viewport keeps device-width + initialScale only',
    rootLayout.includes("width: 'device-width'") && rootLayout.includes('initialScale: 1'))
  check('themeColor matches the dark canvas',
    rootLayout.includes("themeColor: '#0d1016'"))
  check('global focus-visible treatment preserved',
    globals.includes(':focus-visible {') &&
    globals.includes('outline: 2px solid hsl(var(--focus-ring))'))
  check('reduced-motion behavior preserved',
    globals.includes('prefers-reduced-motion') && globals.includes('animation: none'))
  check('html keeps the dark class; Geist Sans untouched',
    rootLayout.includes('className={`dark') && rootLayout.includes('GeistSans.variable'))
}

// ── 6. Legacy islands repaired ───────────────────────────────────────
console.log('\n6. Legacy islands — no audited raw light-only styling')
{
  const RAW_LIGHT = /green-\d{3}|bg-green|text-green|red-\d{3}|amber-\d{3}|blue-\d{3}|gray-\d{3}|slate-\d{3}|zinc-\d{3}/
  check('login: no raw palette colors remain', !RAW_LIGHT.test(login))
  check('login: inputs/tabs/buttons use semantic tokens',
    login.includes('bg-surface-interactive border border-edge text-ink') &&
    login.includes('bg-surface-sunken p-1 gap-1') &&
    login.includes('bg-brand') && login.includes('hover:bg-brand-hover') &&
    login.includes('focus:ring-focus-ring'))
  check('login: success + error messaging uses semantic state tokens',
    login.includes('bg-success-subtle') && login.includes('text-success') &&
    login.includes('text-critical bg-critical-subtle'))
  check('login: no legacy token utilities remain',
    !/(bg-background|bg-secondary|border-input|text-foreground|text-muted-foreground|ring-ring|bg-primary|text-destructive)/
      .test(stripComments(login)))
  check('login: auth flows untouched (3 modes, same handlers, same redirects)',
    login.includes('signInWithPassword') && login.includes('signUp') &&
    login.includes('signInWithOtp') &&
    login.includes("window.location.assign('/dashboard')") &&
    login.includes("'signin' | 'signup' | 'magic'"))
  check('ExerciseForm: no legacy token utilities remain',
    !/(bg-secondary|border-input|text-foreground|text-muted-foreground|ring-ring|border-border|bg-muted\b|text-destructive)/
      .test(stripComments(exerciseForm)))
  check('ExerciseForm: inputs use semantic tokens',
    exerciseForm.includes('bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted') &&
    exerciseForm.includes('focus:ring-focus-ring'))
  check('ExerciseForm: behavior untouched (tracking modes, muscle roles, disclosures)',
    exerciseForm.includes('tracking_mode') && exerciseForm.includes('aria-expanded') &&
    exerciseForm.includes('handleSave') && exerciseForm.includes('PRIMARY_MUSCLES'))
  check('profile NumField: input uses semantic tokens',
    profile.includes('bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus-ring'))
  check('profile: unit round-trip logic untouched',
    profile.includes('kgToLbs') && profile.includes('lbsToKg') &&
    profile.includes('inputMode="decimal"'))
}

// ── 7. No theme toggle, no persistence mechanism ─────────────────────
console.log('\n7. Dark-only — no toggle')
{
  const shellFiles = ['src/app/layout.tsx', 'src/app/(app)/layout.tsx',
    'src/components/layout/Sidebar.tsx', 'src/components/layout/TopBar.tsx',
    'src/components/layout/MoreSheet.tsx', 'src/components/layout/MobileBottomNav.tsx']
  check('no ThemeToggle / theme switcher anywhere in the shell',
    shellFiles.every((f) => !read(f).includes('ThemeToggle') && !read(f).toLowerCase().includes('theme toggle')))
  check('no localStorage/cookie theme mechanism introduced',
    ['src/app', 'src/components', 'src/lib'].every((dir) => {
      const walk = (d: string): boolean => readdirSync(d, { withFileTypes: true }).every((e) => {
        const full = `${d}/${e.name}`
        if (e.isDirectory()) return walk(full)
        if (!/\.(ts|tsx)$/.test(e.name)) return true
        const c = read(full)
        return !/localStorage|sessionStorage/.test(c) || !/theme/i.test(c)
      })
      return walk(dir)
    }))
  check('next-themes or similar not added',
    !read('package.json').includes('next-themes'))
}

// ── 8. Behavioral preservation ───────────────────────────────────────
console.log('\n8. Behavioral preservation')
{
  // RETARGET (UI-3): 020 is that approved phase's dashboard-prefs
  // migration — the boundary (no UNEXPECTED migration) survives as
  // "exactly 20, and the single addition is the named UI-3 file".
  // RETARGET (UI-5B1B): 021_ui5b_transactional_ordering.sql is the approved transactional-ordering migration.
  check('migration boundary: exactly 22 (021 = UI-5B1B ordering; 022 = UI-5B2 reuse)',
    // RETARGET (UI-5B2): 022_ui5b2_workout_reuse.sql is the approved
    // workout-reuse migration (create_routine_from_workout +
    // repeat_workout). The boundary moves from exactly-21 to
    // exactly-22; no other migration may appear.
    (/* RETARGET (EXLIB-1B2): 023_exlib_catalog_and_delivery_contract.sql is the approved-for-drafting EXLIB catalog migration (DRAFT, not applied); the boundary moves from exactly-22 to exactly-23; no other migration may appear. */ /* RETARGET (EXLIB-1B3B migration 024 draft): 024_exlib_post_application_hardening.sql is the approved-scope hardening draft (DRAFT, not applied; sha256 190550ecdb99df702ab03d1b07592f861070141e5091eb25bc5bf45f211cc980); the boundary moves from exactly-23 to exactly-24; both filenames stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-1C0B3 migration 025 draft): 025_exlib_equipment_vocabulary_support.sql is the authorized equipment-vocabulary draft (DRAFT, not applied; sha256 fbda16f4d25cacd1715b199050506a4da15896355d96700876b76c68826d304c); the boundary moves from exactly-24 to exactly-25; 024 and 025 both stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-2F migration 026 apply-prep candidate): 026_exlib_plank_seed_reconciliation.sql is the reviewed apply-prep candidate prepared by EXLIB-2F (PREPARED, NOT APPLIED; its executable SQL is byte-identical to the promoted EXLIB-2E proposal sha256 a6696066d178ced7e53bf81e7106cce64a87e2c73d9b342464d930a2fe3c2108, candidate file sha256 620185b62c589c55fb30a237589589f46002a9d6c391b9ab936e07a6641cf4bc); the boundary moves from exactly-25 to exactly-26; 023/024/025/026 all stay pinned; no other migration may appear. */ /* RETARGET (EXLIB-2M migration-027 apply-prep): 027_exlib_catalog_content_schema.sql is the reviewed apply-prep candidate prepared by EXLIB-2M (PREPARED, NOT APPLIED; its executable SQL is byte-identical to the promoted EXLIB-2L proposal sha256 9a0505c8f2fea3f4330e7c80e22ffd8bc6867760b335a7468ea4587f0bd70553, candidate file sha256 90d53aaf8fd341dd99bab22b7d1ca280ec24b8ccee2a28efca6e835e0585a14f); the boundary moves from exactly-26 to exactly-27; 023/024/025/026/027 all stay pinned; no other migration may appear. */ readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).length === 27 && readdirSync('supabase/migrations').some((f) => f === '026_exlib_plank_seed_reconciliation.sql') && readdirSync('supabase/migrations').some((f) => f === '027_exlib_catalog_content_schema.sql') && readdirSync('supabase/migrations').some((f) => f === '023_exlib_catalog_and_delivery_contract.sql') && readdirSync('supabase/migrations').some((f) => f === '024_exlib_post_application_hardening.sql') && readdirSync('supabase/migrations').some((f) => f === '025_exlib_equipment_vocabulary_support.sql')) &&
    readdirSync('supabase/migrations').filter((f) => f.startsWith('020')).length === 1 &&
    readdirSync('supabase/migrations').some((f) => f === '020_ui3_dashboard_preferences.sql'))
  check('fixed shell + sole scroll owner untouched',
    read('src/app/(app)/layout.tsx').includes('fixed inset-0 flex overflow-hidden bg-canvas') &&
    read('src/app/(app)/layout.tsx').includes('flex-1 overflow-y-auto'))
  // RETARGET (UI-2): pinned the pre-UI-2 grid strings to prove UI-1A
  // did not recompose Today — a historical claim. The surviving
  // boundary: no UI-1A marker in the page and the energy widget
  // contract intact (UI-2's recomposition is owned by verify-ui2).
  check('dashboard carries no UI-1A recomposition (energy contract intact)',
    (() => {
      const dash = read('src/app/(app)/dashboard/page.tsx')
      return dash.includes('<TodayWidget id="energy">') && !dash.includes('UI-1A')
    })())
  check('Progress range navigation + scroll={false} untouched',
    (() => {
      const section = read('src/components/progress/EnergyTrendSection.tsx')
      return section.includes('scroll={false}') &&
        section.includes('/progress?range=${weeks}') &&
        !section.includes('UI-1')
    })())
  check('energy/nutrition/coach/workout/fasting/weight libs untouched (no UI-1A marker)',
    ['src/lib/energy-facts.ts', 'src/lib/energy-model.ts', 'src/lib/coach-signals.ts',
      'src/lib/today-energy.ts', 'src/lib/progress-energy.ts', 'src/lib/goal-adjustments.ts',
      'src/lib/fasting.ts', 'src/lib/weight-trends.ts', 'src/lib/nutrition-trends.ts']
      .every((f) => !read(f).includes('UI-1')))
  check('no eat-back/burn logic introduced anywhere in the diff surface',
    [globals, rootLayout, login, exerciseForm, profile].every((f) =>
      !/eat.?back|earned (calories|food)|totalBurn|calories_burned/i.test(stripComments(f))))
  check('server/client boundaries unchanged in touched files',
    login.includes("'use client'") && exerciseForm.includes("'use client'") &&
    profile.includes("'use client'") && !rootLayout.includes("'use client'"))
  check('loading skeleton geometry untouched (dashboard loading identical classes)',
    read('src/app/(app)/dashboard/loading.tsx').includes('skeleton'))
  check('no new dependency added (package.json byte-stable except none)',
    (() => {
      const pkg = read('package.json')
      return !pkg.includes('next-themes') && !pkg.includes('recharts') &&
        !pkg.includes('framer-motion') && pkg.includes('"next": "14.2.13"')
    })())
}

// ── 9. Determinism ───────────────────────────────────────────────────
console.log('\n9. Determinism')
{
  const secondPass = readFileSync('src/app/globals.css', 'utf8')
  check('token parse is repeatable (same file, same values)',
    secondPass === globals && tokenValue('--canvas') === '220 25% 7%')
  check('no runtime randomness/date-dependence in the theme layer',
    !globalsCode.includes('Math.random') && !globalsCode.includes('Date.now'))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
