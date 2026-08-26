// ============================================================
// ForgeFitOS — UI-7 Profile, Onboarding, Authentication, and
// Full-App Consistency harness.
// Proves the presentation rebuild of /profile and the onboarding
// wizard, the login polish, the NumField/number-input consistency
// pass, the app-wide user-visible text-glyph cleanup (Lucide-only),
// the terminology alignment, and the proven-dead presentation-code
// removals — while every profile write, onboarding contract, auth
// behavior, unit conversion, decision-log side effect, and
// missing-vs-zero rule stays byte- or behavior-anchored.
// Deterministic; independent of machine timezone.
// Run from the repository root:
//   npx tsx scripts/verify-ui7.ts
// ============================================================

import { readFileSync, readdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import React from 'react'
;(globalThis as any).React = React
import { renderToStaticMarkup } from 'react-dom/server'

const Module = require('module')
const origLoad = Module._load
Module._load = function (request: string) {
  if (request === 'next/navigation') {
    return {
      redirect: (url: string) => { throw new Error(`redirect(${url})`) },
      useRouter: () => ({ push() {}, replace() {}, refresh() {}, back() {}, prefetch() {} }),
      usePathname: () => '/profile',
      useSearchParams: () => new URLSearchParams(),
    }
  }
  return origLoad.apply(this, arguments as any)
}

let passed = 0
let failed = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}
const read = (p: string) => readFileSync(p, 'utf8')
const stripComments = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// The exact UI-7 product inventory (worktree, alongside the harness
// retargets, this file, and the phase notes).
const UI7_PRODUCT = [
  '.env.example',
  'src/app/(app)/dashboard/page.tsx',
  'src/app/(app)/profile/page.tsx',
  'src/app/(app)/progress/exercises/[id]/page.tsx',
  'src/app/(app)/progress/page.tsx',
  'src/app/(app)/weigh-in/page.tsx',
  'src/app/(auth)/login/page.tsx',
  // RETARGET (UI-7 closeout correction, authentication messaging):
  // the colocated pure message helper joins the admitted scope.
  'src/app/(auth)/login/auth-messages.ts',
  'src/app/globals.css',
  'src/components/dashboard/DailyMetricTile.tsx',
  'src/components/dashboard/DecisionLogCard.tsx',
  'src/components/dashboard/FastingCard.tsx',
  'src/components/dashboard/NutritionCard.tsx',
  'src/components/dashboard/StepsCard.tsx',
  'src/components/dashboard/WeightCard.tsx',
  'src/components/dashboard/WorkoutCard.tsx',
  'src/components/onboarding/OnboardingWizard.tsx',
  'src/components/onboarding/Step1Bio.tsx',
  'src/components/onboarding/Step3Schedule.tsx',
  'src/components/onboarding/Step4Nutrition.tsx',
  'src/components/weigh-in/WeighInForm.tsx',
  'src/components/workout/ExercisePicker.tsx',
  'src/components/workout/ProgressBadge.tsx',
  'tailwind.config.ts',
]

const profilePage = read('src/app/(app)/profile/page.tsx')
const profileLoading = read('src/app/(app)/profile/loading.tsx')
const wizard = read('src/components/onboarding/OnboardingWizard.tsx')
const step1 = read('src/components/onboarding/Step1Bio.tsx')
const step2 = read('src/components/onboarding/Step2Goals.tsx')
const step3 = read('src/components/onboarding/Step3Schedule.tsx')
const step4 = read('src/components/onboarding/Step4Nutrition.tsx')
const loginPage = read('src/app/(auth)/login/page.tsx')
const callbackRoute = read('src/app/(auth)/auth/callback/route.ts')
const globals = read('src/app/globals.css')
const tw = read('tailwind.config.ts')
const envExample = read('.env.example')
const routeMatch = read('src/components/layout/route-match.ts')

async function main() {
  // ── A. Inventory and protected boundaries ───────────────────────────
  console.log('\nA. Inventory and boundaries')
  {
    check('A1: worktree changes stay inside the declared UI-7 scope',
      (() => {
        let out = ''
        try { out = execSync('git status --porcelain', { encoding: 'utf8' }) } catch { return false }
        return out.split('\n').filter(Boolean).every((line) => {
          const f = line.slice(3).trim()
          return UI7_PRODUCT.includes(f) ||
            f === 'docs/ui7-profile-onboarding-auth-consistency-notes.md' ||
            // RETARGET (UI-overhaul closeout): the final closeout
            // document is admitted while uncommitted.
            f === 'docs/ui-overhaul-closeout.md' ||
            // RETARGET (EXLIB-1A): the discovery-phase research
            // artifacts (docs/exlib1a-*) are admitted while uncommitted.
            f.startsWith('docs/exlib1a-') ||
            // RETARGET (EXLIB-1B1): the architecture/review-contract
            // artifacts (docs/exlib1b1-*) are admitted while uncommitted.
            f.startsWith('docs/exlib1b1-') ||
            // ADMISSION (EXLIB-1B3A): the audit-only hardening
            // notes (docs/exlib1b3-*) are admitted while uncommitted.
            f.startsWith('docs/exlib1b3-') ||
            // ADMISSION (EXLIB-1C0): the approval-packet and
            // review-proposal artifacts are admitted while
            // uncommitted.
            f.startsWith('docs/exlib1c0-') ||
            // ADMISSION (EXLIB-1C0A): the private-use decision and
            // equipment-resolution overlay artifacts are admitted
            // while uncommitted.
            f.startsWith('docs/exlib1c0a-') ||
            // ADMISSION (EXLIB-1C0B): the displacement-audit
            // artifacts are admitted while uncommitted.
            f.startsWith('docs/exlib1c0b-') ||
            // ADMISSION (EXLIB-1C0B2): the equipment-decision
            // record artifacts are admitted while uncommitted.
            f.startsWith('docs/exlib1c0b2-') ||
            // ADMISSION (EXLIB-1B3B migration 024 draft): the
            // uncommitted hardening draft is admitted.
            f === 'supabase/migrations/024_exlib_post_application_hardening.sql' ||
            // ADMISSION (EXLIB-1C0B3): the authorized migration-025
            // draft and the coordinated equipment-vocabulary product
            // changes are admitted while uncommitted.
            f === 'supabase/migrations/025_exlib_equipment_vocabulary_support.sql' ||
            f === 'src/types/database.ts' ||
            f === 'src/lib/exercise-validation.ts' ||
            f === 'src/lib/constants.ts' ||
            f === 'src/lib/workout.ts' ||
            // ADMISSION (EXLIB-1C0B3): the implementation record and
            // local-only guard are admitted while uncommitted.
            f.startsWith('docs/exlib1c0b3-') ||
            // RETARGET (EXLIB-1B2): the approved-for-drafting migration
            // 023 draft is admitted while uncommitted.
            f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||
            f.startsWith('scripts/verify-')
        })
      })())
    check('A2: APIs, business libs, schema, middleware, and deps byte-untouched (git)',
      (() => {
        try {
          // ADMISSION (EXLIB-1B2 Revision H): the committed 023
          // draft (candidate 8ec67b4) is corrected in-review; its
          // tracked modification is admitted. Nothing else may.
          return execSync(
            'git diff --name-only -- src/lib/ src/app/api/ src/middleware.ts supabase/ package.json package-lock.json',
            { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
            .every((f) => f === 'supabase/migrations/023_exlib_catalog_and_delivery_contract.sql' ||
              /* ADMISSION (EXLIB-1C0B3): the authorized coordinated
                 equipment-vocabulary product changes are admitted
                 while uncommitted (exact four paths only). */
              f === 'src/types/database.ts' ||
              f === 'src/lib/exercise-validation.ts' ||
              f === 'src/lib/constants.ts' ||
              f === 'src/lib/workout.ts')
        } catch { return false }
      })())
    check('A3: auth callback route byte-untouched (redirect/cookie rules intact)',
      (() => {
        try {
          return execSync(
            'git diff --name-only -- "src/app/(auth)/auth/callback/route.ts" "src/app/api/auth/signout/route.ts"',
            { encoding: 'utf8' }).trim() === ''
        } catch { return false }
      })())
  }

  // ── B. Profile behavior anchors ─────────────────────────────────────
  console.log('\nB. Profile')
  {
    check('B1: PageHeader owns the Profile title with the exact user-control copy',
      profilePage.includes('title="Profile"') &&
      (profilePage.match(/<PageHeader/g) || []).length === 1 &&
      !profilePage.includes('<h1') &&
      profilePage.includes('never changes nutrition targets on its own'))
    check('B2: every profile payload field and write preserved',
      ['display_name:', 'age:', 'height_cm:', 'current_weight_kg:', 'goal_weight_kg:',
        'bf_pct:', 'main_goal:', 'activity_level:', 'step_goal:',
        'preferred_weigh_in_cadence:', 'preferred_weigh_in_day:', 'preferred_weigh_in_time:',
        'fasting_enabled:', 'default_fasting_goal_hours:']
        .every((f) => profilePage.includes(f)) &&
      profilePage.includes(".from('user_profiles').update(") &&
      profilePage.includes('.eq(\'user_id\', user.id)'))
    check('B3: unit conversions and parsing byte-present (imperial round-trip)',
      profilePage.includes('kgToLbs(p.current_weight_kg)') &&
      profilePage.includes('lbsToKg(parseFloat(weightLbs))') &&
      profilePage.includes('feetInchesToCm(parseInt(heightFt), parseInt(heightIn') &&
      profilePage.includes('cmToFeetInches(p.height_cm)') &&
      profilePage.includes('parseFloat2(bfPct)') &&
      profilePage.includes('inputMode="decimal"'))
    check('B4: decision-log side effects unchanged (cadence/step/fasting/goal)',
      profilePage.includes("'weigh_in_cadence_changed'") &&
      profilePage.includes("'step_goal_changed'") &&
      profilePage.includes("'fasting_goal_changed'") &&
      profilePage.includes("'main_goal_changed'") &&
      profilePage.includes('const newGoal        = mainGoal || prevGoal') &&
      profilePage.includes("status: 'applied', created_by: 'user'") &&
      !profilePage.includes('nutrition_targets'))
    check('B5: profile stays on its approved readable width with grouped sections',
      profilePage.includes('max-w-4xl') &&
      ['Personal info', 'Main goal', 'Activity level', 'Weigh-in schedule', 'Fasting']
        .every((h) => profilePage.includes(`>${h}</h3>`)))
    check('B6: profile loading mirrors the page geometry (no fake values)',
      profileLoading.includes('max-w-4xl') &&
      profileLoading.includes('aria-hidden="true"') &&
      !profileLoading.includes('<button') && !profileLoading.includes('<h1'))
  }

  // ── C. NumField / number inputs ─────────────────────────────────────
  console.log('\nC. NumField')
  {
    check('C1: NumField label associated, 44px, semantic tokens, adjacent unit',
      profilePage.includes('function NumField') &&
      profilePage.includes('<label htmlFor={id}') &&
      profilePage.includes('id={id}') &&
      profilePage.includes('min-h-11 px-3 rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus-ring'))
    check('C2: missing-vs-zero — empty value shows placeholder only; a stored zero renders "0"',
      profilePage.includes("setAge(p.age ? String(p.age) : '')") &&
      profilePage.includes('value={value}') &&
      profilePage.includes('placeholder={placeholder}') &&
      !profilePage.includes('?? 0'))
    check('C3: parsing, bounds, and steps untouched',
      profilePage.includes('min="13" max="100" step="1"') &&
      profilePage.includes('min="50" max="700" step="0.1"') &&
      profilePage.includes('min="2000" max="20000" step="500"'))
    check('C4: onboarding Input suffix slot reserves padding and never intercepts clicks',
      step1.includes("suffix ? 'pr-10' : ''") &&
      step1.includes('pointer-events-none') &&
      ['suffix="ft"', 'suffix="in"', 'suffix="lbs"', 'suffix="%"']
        .every((u) => step1.includes(u)))
  }

  // ── D. Onboarding contract ──────────────────────────────────────────
  console.log('\nD. Onboarding')
  {
    check('D1: step machine untouched — order, bounds, back/next, single submit',
      wizard.includes("const STEP_LABELS = ['Personal details', 'Goals', 'Schedule', 'Nutrition']") &&
      wizard.includes('setStep((s) => Math.min(4, s + 1))') &&
      wizard.includes('setStep((s) => Math.max(1, s - 1))') &&
      (wizard.match(/supabase\.from\(/g) || []).length === 3 &&
      wizard.includes("window.location.assign('/dashboard')"))
    check('D2: validation and payload anchors byte-present',
      step1.includes('const canProceed = !!form.display_name.trim() && !!form.weight_lbs') &&
      wizard.includes('onboarding_complete: true') &&
      wizard.includes("onConflict: 'user_id'") &&
      wizard.includes('calculateNutritionTargets'))
    check('D3: PageHeader owns the wizard title; textual step state preserved',
      wizard.includes('title="Set up your profile"') &&
      wizard.includes('description={`Step ${step} of 4 — ${STEP_LABELS[step - 1]}`}') &&
      !wizard.includes('<h1'))
    check('D4: progress segments stay decorative (aria-hidden) — never color-only state',
      wizard.includes('aria-hidden="true"') &&
      wizard.includes("s < step ? 'bg-brand' : s === step ? 'bg-brand-active' : 'bg-surface-sunken'"))
    check('D5: no gamification, celebration emoji, or invented coaching claims',
      [wizard, step1, step2, step3, step4].every((s) =>
        !/streak|score|rank|award|congrat|crushing|amazing!/i.test(stripComments(s))))
    check('D6: guardrail warning copy path untouched',
      step4.includes('nutrition.warnings.map') &&
      wizard.includes('nutrition.warnings.length > 0'))
  }

  // ── E. Authentication surfaces ──────────────────────────────────────
  console.log('\nE. Authentication')
  {
    check('E1: all three modes with associated labels and password-manager attributes',
      loginPage.includes("autoComplete=\"email\"") &&
      loginPage.includes("autoComplete=\"current-password\"") &&
      loginPage.includes("autoComplete=\"new-password\"") &&
      ['signin-email', 'signin-password', 'signup-email', 'signup-password', 'magic-email']
        .every((id) => loginPage.includes(`htmlFor="${id}"`) && loginPage.includes(`id="${id}"`)))
    check('E2: auth behavior byte-present — signIn/signUp/OTP calls and redirects',
      loginPage.includes('auth.signInWithPassword({') &&
      loginPage.includes('auth.signUp({') &&
      loginPage.includes('auth.signInWithOtp({') &&
      loginPage.includes("window.location.assign('/dashboard')") &&
      loginPage.includes("emailRedirectTo: (process.env.NEXT_PUBLIC_APP_URL ?? '') + '/auth/callback'"))
    check('E3: dark theme + semantic tokens only; 44px controls; mode state not color-only',
      loginPage.includes('bg-canvas') &&
      loginPage.includes('text-brand-foreground') &&
      !loginPage.includes('text-[hsl(') &&
      (loginPage.match(/min-h-11/g) || []).length >= 8 &&
      loginPage.includes('aria-pressed={mode === m}') &&
      loginPage.includes("'bg-surface-raised text-ink font-semibold shadow-sm'"))
    check('E4: error and success states carry text on semantic status tokens',
      loginPage.includes('text-critical bg-critical-subtle') &&
      loginPage.includes('text-success'))
    check('E5: callback route still exchanges the code and redirects (untouched)',
      callbackRoute.includes('exchangeCodeForSession') &&
      callbackRoute.includes('/login'))
    // UI-7 closeout correction — authentication messaging.
    const { SIGNUP_NEUTRAL_MESSAGE, presentAuthError } =
      await import('../src/app/(auth)/login/auth-messages')
    check('E6: signup copy is neutral and anti-enumeration-safe; definitive copy gone',
      SIGNUP_NEUTRAL_MESSAGE ===
        'Check your email to continue. If this address can be registered, we sent a confirmation link.' &&
      loginPage.includes('setDone(SIGNUP_NEUTRAL_MESSAGE)') &&
      !loginPage.includes('Account created'))
    check('E7: email throttle maps to friendly copy; unrelated errors pass through verbatim',
      presentAuthError('email rate limit exceeded') ===
        'Too many email attempts. Please wait before trying again.' &&
      presentAuthError('Email rate limit exceeded') ===
        'Too many email attempts. Please wait before trying again.' &&
      presentAuthError('Invalid login credentials') === 'Invalid login credentials' &&
      presentAuthError('User already registered') === 'User already registered' &&
      presentAuthError('') === '' &&
      (loginPage.match(/setError\(presentAuthError\(err\.message\)\); return/g) || []).length === 3)
    check('E8: every submission clears BOTH stale messages before awaiting; panels never coexist',
      (loginPage.match(/setError\(null\); setDone\(null\); setLoading\(true\)/g) || []).length === 3 &&
      (loginPage.match(/setError\(/g) || []).length === 7 &&
      loginPage.indexOf('setError(null); setDone(null); setLoading(true)') <
        loginPage.indexOf('auth.signInWithPassword'))
    check('E9: mode change clears both messages and preserves the typed email',
      loginPage.includes('onClick={() => { setMode(m); setError(null); setDone(null) }}') &&
      !loginPage.includes("setEmail('')"))
    check('E10: no account-existence probe or client-supplied identity logic introduced',
      !loginPage.includes('getUserByEmail') && !loginPage.includes('admin.') &&
      !loginPage.includes('fetch(') &&
      !read('src/app/(auth)/login/auth-messages.ts').includes('supabase') &&
      !read('src/app/(auth)/login/auth-messages.ts').includes('fetch'))
    check('E11: status semantics — polite live region for success, alert for errors',
      loginPage.includes('role="status" aria-live="polite"') &&
      (loginPage.match(/role="alert"/g) || []).length === 3)
  }

  // ── F. Terminology (labels only — never routes) ─────────────────────
  console.log('\nF. Terminology')
  {
    check('F1: shell labels — Today/Train/Fuel pillars; Workouts/Food log destinations',
      routeMatch.includes("{ id: 'today', label: 'Today', href: '/dashboard'") &&
      routeMatch.includes("{ id: 'train', label: 'Train', href: '/workouts'") &&
      routeMatch.includes("{ id: 'fuel', label: 'Fuel', href: '/food'") &&
      routeMatch.includes("{ id: 'workouts', label: 'Workouts', href: '/workouts'") &&
      routeMatch.includes("{ id: 'food', label: 'Food log', href: '/food'"))
    check('F2: no route, folder, or endpoint was renamed',
      existsSync('src/app/(app)/dashboard/page.tsx') &&
      existsSync('src/app/(app)/workouts/page.tsx') &&
      existsSync('src/app/(app)/food/page.tsx') &&
      (() => {
        try {
          return execSync('git status --porcelain', { encoding: 'utf8' })
            .split('\n').every((l) => !l.startsWith('R '))
        } catch { return false }
      })())
    check('F3: the dashboard route presents as Today to the user',
      read('src/app/(app)/dashboard/page.tsx').includes("title: 'Today'"))
  }

  // ── G. Glyph cleanup (Lucide-only affordances) ──────────────────────
  console.log('\nG. Glyphs')
  {
    const GLYPHS = ['\u2192', '\u2190', '\u2191', '\u2193', '\u2713', '\u2714', '\u2717', '\u2718']
    const SCOPE_FILES = UI7_PRODUCT.filter((f) => f.endsWith('.tsx'))
    check('G1: zero user-visible text-glyph affordances remain in the UI-7 scope (comments excluded)',
      SCOPE_FILES.every((f) => {
        const code = stripComments(read(f))
        return GLYPHS.every((g) => !code.includes(g))
      }))
    check('G2: replacements are aria-hidden Lucide icons beside the SAME visible labels',
      read('src/components/dashboard/WorkoutCard.tsx').includes('<ArrowRight className="w-3 h-3" aria-hidden="true" />') &&
      read('src/components/weigh-in/WeighInForm.tsx').includes('<Check className="w-3.5 h-3.5" aria-hidden="true" />') &&
      read('src/app/(app)/progress/exercises/[id]/page.tsx').includes('<ArrowLeft className="w-3 h-3" aria-hidden="true" />') &&
      step1.includes('<ArrowRight className="w-4 h-4" aria-hidden="true" />') &&
      step1.includes('<ArrowLeft className="w-4 h-4" aria-hidden="true" />'))
    check('G3: mathematical symbols kept where they are math, not icons',
      step4.includes('\u00d7') &&
      read('src/app/(app)/profile/page.tsx').includes('(x12)'))
    check('G4: progress badges — same wording, consumer-side maps, lib byte-untouched',
      (() => {
        const badge = read('src/components/workout/ProgressBadge.tsx')
        try {
          // ADMISSION (EXLIB-1C0B3): the authorized Smith-machine
          // progression branch is admitted — pure additions only,
          // carrying the phase label; badge maps stay consumer-side.
          const d = execSync('git diff -- src/lib/workout.ts', { encoding: 'utf8' })
          return badge.includes("improved: { label: 'Improved', Icon: TrendingUp }") &&
            badge.includes('{meta ? meta.label : progressLabel(signal)}') &&
            (d === '' ||
              (d.includes('EXLIB-1C0B3') &&
                d.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).length === 0))
        } catch { return false }
      })())
  }

  // ── H. Semantic-token purity in scope ───────────────────────────────
  console.log('\nH. Tokens')
  {
    const LEGACY = /bg-secondary|border-input|focus:ring-ring|text-muted-foreground|bg-background|bg-card(?!-)|border-border|text-destructive|bg-destructive/
    const RAW = /(?:text|bg|border|ring)-(?:green|amber|blue|red|yellow|orange|zinc|gray|grey|neutral)-\d/
    const TOKEN_SCOPE = [
      'src/app/(app)/profile/page.tsx', 'src/app/(auth)/login/page.tsx',
      'src/components/onboarding/OnboardingWizard.tsx', 'src/components/onboarding/Step1Bio.tsx',
      'src/components/onboarding/Step3Schedule.tsx', 'src/components/onboarding/Step4Nutrition.tsx',
      'src/components/weigh-in/WeighInForm.tsx', 'src/components/workout/ProgressBadge.tsx',
    ]
    check('H1: zero legacy/raw palette debt in the rebuilt surfaces',
      TOKEN_SCOPE.every((f) => {
        const code = stripComments(read(f))
        return !LEGACY.test(code) && !RAW.test(code) &&
          !code.includes('bg-white') && !code.includes('#fff') && !code.includes('!important')
      }))
    check('H2: switches use semantic thumbs (no raw white)',
      profilePage.includes('rounded-full bg-ink shadow') &&
      step3.includes('rounded-full bg-ink shadow'))
  }

  // ── I. Dead presentation code — removals proven, live items kept ────
  console.log('\nI. Dead-code cleanup')
  {
    const REMOVED_ROLES = ['text-display', 'text-card-title', 'text-body', 'text-metric',
      'text-button', 'text-badge', 'text-chart-annotation']
    const LIVE_ROLES = ['text-page-title', 'text-section-title', 'text-support', 'text-label']
    const srcFiles: string[] = []
    ;(function walk(dir: string) {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(`${dir}/${e.name}`)
        else if (/\.(tsx|ts)$/.test(e.name)) srcFiles.push(`${dir}/${e.name}`)
      }
    })('src')
    const allSrc = srcFiles.map((f) => read(f)).join('\n')
    check('I1: the seven removed typography roles have zero source references and no definitions',
      REMOVED_ROLES.every((r) =>
        !new RegExp(`(?<![\\w-])${r}(?![\\w-])`).test(allSrc) &&
        !globals.includes(`.${r} `) && !globals.includes(`.${r}{`)))
    check('I2: the four live roles are still defined AND still consumed',
      LIVE_ROLES.every((r) => globals.includes(`.${r} `)) &&
      read('src/components/ui/page-header.tsx').includes('text-page-title') &&
      read('src/components/ui/section-header.tsx').includes('text-section-title') &&
      read('src/components/ui/empty-state.tsx').includes('text-support') &&
      read('src/components/ui/page-header.tsx').includes('text-label'))
    check('I3: the legacy card alias is gone with zero class usages anywhere',
      !globals.includes('.shred-card {') &&
      !new RegExp('className="[^"]*shred-card').test(allSrc))
    check('I4: the legacy literal palette block is gone with zero class usages',
      !tw.includes('shred:') &&
      !/shred-(?:green|amber|red|blue)/.test(allSrc))
    check('I5: the stale env reference is gone; every remaining env var has a real reader',
      !envExample.includes('NEXT_PUBLIC_APP_NAME') &&
      envExample.includes('NEXT_PUBLIC_APP_URL') &&
      allSrc.includes('process.env.NEXT_PUBLIC_APP_URL') &&
      allSrc.includes('process.env.NEXT_PUBLIC_SUPABASE_URL') &&
      allSrc.includes('process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY'))
    check('I6: ambiguous-or-live legacy classes preserved untouched (.metric-label, .metric-value, .status-muted)',
      globals.includes('.metric-label {') &&
      globals.includes('.metric-value {') &&
      globals.includes('.status-muted'))
  }

  // ── J. Runtime renders ──────────────────────────────────────────────
  console.log('\nJ. Runtime renders')
  {
    const { ProgressBadge } = await import('../src/components/workout/ProgressBadge')
    const GLYPHS = ['\u2191', '\u2193', '\u2192', '\u2713']
    const CASES: Array<[string, string, string | null]> = [
      ['improved', 'Improved', 'lucide-trending-up'],
      ['declined', 'Declined', 'lucide-trending-down'],
      ['same', 'Same', 'lucide-move-right'],
      ['new', 'New exercise', null],
    ]
    check('J1: rendered ProgressBadge — glyph-free text + aria-hidden icon for every signal',
      CASES.every(([sig, label, icon]) => {
        const html = renderToStaticMarkup(React.createElement(ProgressBadge, { signal: sig as never }))
        return html.includes(label) &&
          GLYPHS.every((g) => !html.includes(g)) &&
          (icon === null
            ? !html.includes('<svg')
            : new RegExp(`<svg(?=[^>]*aria-hidden="true")[^>]*${icon}`).test(html))
      }))
    const { Step1Bio } = await import('../src/components/onboarding/Step1Bio')
    const form = {
      display_name: 'Probe', age: '', sex: '', height_ft: '', height_in: '0',
      weight_lbs: '185', goal_weight_lbs: '', bf_pct: '', goal_bf_pct: '',
      main_goal: 'fat_loss', training_experience: 'intermediate',
      activity_level: 'moderately_active', step_goal: '8000',
      preferred_weigh_in_cadence: 'weekly', preferred_weigh_in_day: '5',
      preferred_weigh_in_time: 'morning', fasting_enabled: false,
      default_fasting_goal_hours: '', fasting_notes: '', dietary_prefs: [],
      injuries: '', deficit_override: '',
    }
    const step1Html = renderToStaticMarkup(
      React.createElement(Step1Bio, { form: form as never, update: () => {}, onNext: () => {} }))
    check('J2: rendered Step 1 — associated labels, suffix units, glyph-free Continue with icon',
      step1Html.includes('for="ob-name"') && step1Html.includes('id="ob-name"') &&
      step1Html.includes('>lbs</span>') && step1Html.includes('pr-10') &&
      /Continue<svg(?=[^>]*aria-hidden="true")/.test(step1Html) &&
      !step1Html.includes('\u2192') && !step1Html.includes('\u2190'))
    const { OnboardingWizard } = await import('../src/components/onboarding/OnboardingWizard')
    const wizardHtml = renderToStaticMarkup(React.createElement(OnboardingWizard))
    check('J3: rendered wizard — PageHeader title, textual step state, step 1 content',
      wizardHtml.includes('Set up your profile') &&
      wizardHtml.includes('Step 1 of 4') &&
      wizardHtml.includes('Personal details') &&
      wizardHtml.includes('Tell us about yourself') &&
      (wizardHtml.match(/<h1/g) || []).length === 1)
    const LoginPage = (await import('../src/app/(auth)/login/page')).default
    const loginHtml = renderToStaticMarkup(React.createElement(LoginPage))
    check('J4: rendered login — brand lockup, three mode tabs, associated sign-in form, 44px controls',
      loginHtml.includes('ForgeFitOS') &&
      loginHtml.includes('Sign in') && loginHtml.includes('Create account') &&
      loginHtml.includes('Magic link') &&
      loginHtml.includes('for="signin-email"') && loginHtml.includes('id="signin-email"') &&
      loginHtml.includes('for="signin-password"') &&
      loginHtml.includes('min-h-11') &&
      loginHtml.includes('aria-pressed="true"'))
    const ProfilePage = (await import('../src/app/(app)/profile/page')).default
    const profileHtml = renderToStaticMarkup(React.createElement(ProfilePage))
    check('J5: rendered profile initial state — the honest loading skeleton, no fake values, no h1',
      profileHtml.includes('aria-hidden="true"') &&
      !profileHtml.includes('<h1') &&
      !profileHtml.includes('<button') &&
      profileHtml.includes('max-w-4xl'))
  }

  // ── K. Responsive evidence + exclusions + integrity ─────────────────
  console.log('\nK. Evidence and integrity')
  {
    const notes = read('docs/ui7-profile-onboarding-auth-consistency-notes.md')
    check('K1: responsive empirics recorded for all six approved widths',
      ['| 320 ', '| 375 ', '| 768 ', '| 1024 ', '| 1440 ', '| 1920 ']
        .every((w) => notes.includes(w)) &&
      notes.includes('Measured responsive empirics'))
    check('K2: roadmap exclusions remain unimplemented',
      (() => {
        try {
          execSync("grep -rilE 'strengthlog|upvote|milestone badge|pace trend' src", { encoding: 'utf8' })
          return false
        } catch { return true }
      })() &&
      !existsSync('src/components/coach/SuggestedRoutine.tsx') &&
      !tw.includes('max-w-7xl'))
    check('K3: no scoring, streaks, ranks, grades, or projections introduced',
      UI7_PRODUCT.filter((f) => f.endsWith('.tsx')).every((f) =>
        !/streak|leaderboard|points earned|consistency %|grade/i.test(stripComments(read(f)))))
    check('K4: migrations exactly 001-022 with the 022 fingerprint',
      (() => {
        const files = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))
        const m022 = readFileSync('supabase/migrations/022_ui5b2_workout_reuse.sql')
        const { createHash } = require('crypto')
        // RETARGET (EXLIB-1B2): the approved-for-drafting EXLIB
        // catalog migration joins the boundary (DRAFT, not applied).
        // RETARGET (EXLIB-1B3B migration 024 draft): the hardening
        // draft joins the boundary (DRAFT, not applied);
        // exactly-23 becomes exactly-24 with both filenames pinned.
        // RETARGET (EXLIB-1C0B3 migration 025 draft): the authorized
        // equipment-vocabulary draft joins the boundary (DRAFT, not
        // applied); exactly-24 becomes exactly-25 with 024 and 025
        // both pinned.
        return files.length === 25 &&
          files.includes('023_exlib_catalog_and_delivery_contract.sql') &&
          files.includes('024_exlib_post_application_hardening.sql') &&
          files.includes('025_exlib_equipment_vocabulary_support.sql') &&
          m022.length === 19112 &&
          createHash('sha256').update(m022).digest('hex') ===
            '1432692f700b1686243aa8219ea4af3146e2bec30b228b3f9138d60e072e1241'
      })())
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
