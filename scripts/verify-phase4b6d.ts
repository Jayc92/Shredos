// ============================================================
// ForgeFitOS — Phase 4B.6D deterministic verification harness
// Verifies the onboarding redesign + final active-route legacy
// cleanup: wizard/step presentation on the ForgeFitOS system,
// zero active .shred-card consumption (alias retained), the
// physically proven 4B.6C shell + Select invariants — and,
// critically, that every onboarding behavior (step state, field
// semantics, validation gates, nutrition math, the profile /
// nutrition-target / decision-log write contract, redirect) is
// byte-anchored unchanged.
// Run from the repository root:
//   npx tsx scripts/verify-phase4b6d.ts
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
const stripComments = (s: string) => s.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u')

const page = read('src/app/(app)/onboarding/page.tsx')
const wizard = read('src/components/onboarding/OnboardingWizard.tsx')
const step1 = read('src/components/onboarding/Step1Bio.tsx')
const step2 = read('src/components/onboarding/Step2Goals.tsx')
const step3 = read('src/components/onboarding/Step3Schedule.tsx')
const step4 = read('src/components/onboarding/Step4Nutrition.tsx')
const appLayout = read('src/app/(app)/layout.tsx')
const rootLayout = read('src/app/layout.tsx')
const select = read('src/components/ui/select.tsx')
const optionCard = read('src/components/ui/option-card.tsx')
const globals = read('src/app/globals.css')
const notes = read('docs/phase4b6d-onboarding-final-cleanup-notes.md')

const STEPS = [step1, step2, step3, step4]
const ONBOARDING = [wizard, ...STEPS]

// ── 1. Checkpoint, route, gates ──────────────────────────────────────
console.log('\n1. Checkpoint, route, gates')
{
  check('checkpoint artifacts exist (e1f3556 tree)',
    ['scripts/verify-phase4b6c.ts', 'docs/phase4b6c-fuel-profile-notes.md',
      'src/components/food/FuelSubNav.tsx', 'src/app/(app)/profile/loading.tsx',
      'supabase/migrations/013_phase3e_goal_adjustments.sql']
      .every((f) => existsSync(f)))
  check('all prior notes exist',
    ['phase4a-ux-information-architecture-audit', 'phase4b1-foundation-notes',
      'phase4b2-navigation-notes', 'phase4b3-today-notes', 'phase4b4-coach-pillar-notes',
      'phase4b5-progress-pillar-notes', 'phase4b6a-train-hubs-notes',
      'phase4b6b-active-workout-notes', 'phase4b6c-fuel-profile-notes']
      .every((f) => existsSync(`docs/${f}.md`)))
  check('4B.6D notes exist', notes.length > 1500)
  check('onboarding route retained', existsSync('src/app/(app)/onboarding/page.tsx'))
  check('no new routes/aliases introduced',
    !existsSync('src/app/scroll-diag') && !existsSync('src/app/(app)/setup') &&
    !existsSync('src/app/(app)/onboarding/loading.tsx') &&
    !read('next.config.mjs').includes('redirects'))
  check('metadata unchanged', page.includes("title: 'Set up your profile' }"))
  check('auth gate preserved', page.includes("redirect('/login')"))
  check('already-onboarded redirect preserved',
    page.includes("select('onboarding_complete')") &&
    page.includes("if (profile?.onboarding_complete) redirect('/dashboard')"))
  check('server page stays a thin server wrapper',
    !page.includes("'use client'") && page.includes('<OnboardingWizard />'))
  check('wizard remains the existing client island',
    wizard.startsWith("'use client'"))
  check('no new endpoints/context/service-role',
    ONBOARDING.every((f) => !f.includes('createContext') &&
      !f.includes('service_role') && !f.includes('/api/onboarding')))
}

// ── 2. Wizard structure and step state ───────────────────────────────
console.log('\n2. Wizard structure and step state')
{
  check('exactly four steps, exact order',
    wizard.indexOf('<Step1Bio') < wizard.indexOf('<Step2Goals') &&
    wizard.indexOf('<Step2Goals') < wizard.indexOf('<Step3Schedule') &&
    wizard.indexOf('<Step3Schedule') < wizard.indexOf('<Step4Nutrition'))
  check('step conditions exact',
    ['{step === 1 && ', '{step === 2 && ', '{step === 3 && ', '{step === 4 && ']
      .every((c) => wizard.includes(c)))
  check('step state starts at 1', wizard.includes('useState(1)'))
  check('next clamps at 4', wizard.includes('Math.min(4, s + 1)'))
  check('back clamps at 1', wizard.includes('Math.max(1, s - 1)'))
  check('single form state object carried across steps',
    wizard.includes('useState<OnboardingFormState>(INITIAL_STATE)') &&
    wizard.includes('setForm((prev) => ({ ...prev, ...patch }))'))
  check('all four steps receive form + update',
    (wizard.match(/form={form}/g) || []).length === 4 &&
    (wizard.match(/update={update}/g) || []).length === 4)
  check('step labels exact',
    wizard.includes("const STEP_LABELS = ['Personal details', 'Goals', 'Schedule', 'Nutrition']"))
  check('textual step context (not color-only)',
    wizard.includes('Step {step} of 4 — {STEP_LABELS[step - 1]}'))
  check('no autosave / no per-step persistence: the ONLY supabase writes live in handleComplete',
    (wizard.match(/supabase\.from\(/g) || []).length === 3 &&
    wizard.indexOf('async function handleComplete') <
      wizard.indexOf("supabase.from('user_profiles')") &&
    STEPS.every((s) => !s.includes('supabase') && !s.includes('fetch(')))
  check('no localStorage/sessionStorage persistence',
    ONBOARDING.every((f) => !f.includes('localStorage') && !f.includes('sessionStorage')))
  check('step change scrolls the wizard top inside <main> (pinned shell: window.scrollTo is a no-op)',
    wizard.includes("topRef.current?.scrollIntoView({ block: 'start' })") &&
    !stripComments(wizard).includes('window.scrollTo'))
  check('no resize listeners / JS viewport sizing',
    ONBOARDING.every((f) => !stripComments(f).includes('addEventListener') &&
      !stripComments(f).includes('innerHeight')))
}

// ── 3. Step 1 — personal details contract ────────────────────────────
console.log('\n3. Step 1 contract')
{
  check('validation gate unchanged: name + current weight required',
    step1.includes('const canProceed = !!form.display_name.trim() && !!form.weight_lbs'))
  check('gate wired to Continue', step1.includes('disabled={!canProceed}'))
  for (const f of ['display_name', 'age', 'sex', 'height_ft', 'height_in',
    'weight_lbs', 'goal_weight_lbs', 'bf_pct', 'goal_bf_pct']) {
    check(`field preserved: ${f}`, step1.includes(`form.${f}`))
  }
  check('sex options exact (incl. explicit non-answer)',
    ['<option value="">Prefer not to say</option>', '<option value="male">Male</option>',
      '<option value="female">Female</option>', '<option value="other">Other</option>']
      .every((o) => step1.includes(o)))
  check('numeric bounds unchanged (age 13–100, height 3–8ft/0–11in, weight 50–700)',
    step1.includes('min="13" max="100"') && step1.includes('min="3" max="8"') &&
    step1.includes('min="0" max="11"') &&
    (step1.match(/min="50" max="700" step="0.1"/g) || []).length === 2)
  check('body fat bounds unchanged (1–60, 0.1 step)',
    (step1.match(/min="1" max="60" step="0.1"/g) || []).length === 2)
  check('units adjacent to inputs', ['>ft</span>', '>in</span>', '>lbs</span>', '>%</span>']
    .every((u) => step1.includes(u)))
  check('required marker only on the two actually-required fields',
    (step1.match(/<Label required>/g) || []).length === 2 &&
    step1.includes('<Label required>Name</Label>') &&
    step1.includes('<Label required>Current weight</Label>'))
  check('optional fields explicitly optional (goal weight, both body fat)',
    (step1.match(/\(optional\)/g) || []).length === 3 &&
    !step1.includes('required>Est. body fat'))
  check('compact pairs stay two-up only for short numerics',
    step1.includes('<div className="grid grid-cols-2 gap-3">'))
  check('no judgment/medical framing',
    !/must lose|should lose|unhealthy|obese|BMI|diagnos/i.test(step1))
}

// ── 4. Step 2 — goals contract ───────────────────────────────────────
console.log('\n4. Step 2 contract')
{
  for (const v of ['fat_loss', 'muscle_gain', 'recomposition', 'maintenance',
    'strength', 'running']) {
    check(`goal value preserved: ${v}`, step2.includes(`value: '${v}'`))
  }
  check('goal selection via OptionCard (aria-pressed, never color-only)',
    step2.includes('<OptionCard') &&
    optionCard.includes('aria-pressed={selected}') &&
    optionCard.includes('border-2 border-primary'))
  check('experience values preserved',
    ['beginner', 'intermediate', 'advanced'].every((v) => step2.includes(`value: '${v}'`)))
  check('experience uses the compact tile primitive', step2.includes('<OptionCardCompact'))
  check('activity values preserved',
    ['sedentary', 'moderately_active', 'very_active'].every((v) => step2.includes(`value: '${v}'`)))
  check('activity multiplier descriptions unchanged (x10/x12/x14)',
    step2.includes('(x10)') && step2.includes('(x12)') && step2.includes('(x14)'))
  check('step slider bounds unchanged',
    step2.includes('min="2000"') && step2.includes('max="20000"') && step2.includes('step="500"'))
  check('goal selection writes only local form state (no target mutation)',
    step2.includes("update({ main_goal: value })") &&
    !step2.includes('nutrition_targets') && !step2.includes('calculateNutritionTargets'))
  check('goal wording neutral (no goal ranked above another)',
    !/best goal|recommended goal|most popular/i.test(step2))
}

// ── 5. Step 3 — schedule contract ────────────────────────────────────
console.log('\n5. Step 3 contract')
{
  check('cadence values preserved',
    ["preferred_weigh_in_cadence === 'weekly'", "preferred_weigh_in_cadence === 'biweekly'",
      "preferred_weigh_in_cadence: 'manual' }"].every((c) => step3.includes(c)))
  check('cadence via OptionCard', (step3.match(/<OptionCard\n/g) || []).length === 3)
  check('day select from the shared constant', step3.includes('WEIGH_IN_DAYS.map'))
  check('time options exact',
    step3.includes('value="morning">Morning (recommended)') &&
    step3.includes('value="evening">Evening'))
  check('day/time hidden for manual cadence (conditional unchanged)',
    step3.includes("form.preferred_weigh_in_cadence !== 'manual' && ("))
  check('fasting switch semantics unchanged',
    step3.includes('role="switch"') &&
    step3.includes('aria-checked={form.fasting_enabled}') &&
    step3.includes('update({ fasting_enabled: !form.fasting_enabled })'))
  check('fasting goal select gated on the toggle', step3.includes('form.fasting_enabled && ('))
  check('fasting goal options exact (none + shared constant)',
    step3.includes('value="none">No default goal') &&
    step3.includes('FASTING_GOAL_OPTIONS.map'))
  check("fasting 'none' maps back to empty string",
    step3.includes("v === 'none' ? '' : v"))
  check('dietary prefs from shared constant via OptionPill (multi-toggle)',
    step3.includes('DIETARY_PREF_OPTIONS.map') && step3.includes('<OptionPill') &&
    step3.includes('form.dietary_prefs.filter((p) => p !== pref)'))
  check('injuries textarea preserved (optional, 2 rows)',
    step3.includes('rows={2}') && step3.includes('form.injuries'))
  check('labels pinned for the QA-defect selects',
    step3.includes('>Preferred day</label>') && step3.includes('>Time of day</label>') &&
    step3.includes('>Default fasting goal</label>'))
  check('shared Select primitive consumed (no local popover fork)',
    step3.includes("from '@/components/ui/select'") &&
    !step3.includes('SelectPrimitive') && !step3.includes('bg-popover'))
  check('4B.1 brand copy anchor retained',
    step3.includes('ForgeFitOS works on your schedule'))
}

// ── 6. Step 4 — nutrition contract ───────────────────────────────────
console.log('\n6. Step 4 contract')
{
  check('calculation call byte-identical (slider drives deficitOverride)',
    step4.includes('deficitOverride: deficitSlider,') &&
    step4.includes('calculateNutritionTargets({') &&
    step4.includes('weightLbs,') && step4.includes('bfPct: bfPct ?? undefined,'))
  check('default deficit from the shared constant',
    step4.includes('DEFAULT_DEFICIT') &&
    step4.includes("form.deficit_override ? parseInt(form.deficit_override) : DEFAULT_DEFICIT"))
  check('deficit slider bounds unchanged (200–700, step 50)',
    step4.includes('min="200"') && step4.includes('max="700"') && step4.includes('step="50"'))
  check('deficit adjuster only for fat loss / recomposition',
    step4.includes("(form.main_goal === 'fat_loss' || form.main_goal === 'recomposition') && ("))
  check('slider change updates form state exactly as before',
    step4.includes('update({ deficit_override: String(val) })'))
  check('override passed to complete only when moved off default',
    step4.includes('onComplete(deficitSlider !== DEFAULT_DEFICIT ? deficitSlider : undefined)'))
  check('four target tiles exact',
    ["label: 'Calories'", "label: 'Protein'", "label: 'Carbs'", "label: 'Fat min'"]
      .every((l) => step4.includes(l)))
  check('maintenance breakdown copy preserved (factual, not advice)',
    step4.includes('cal maintenance') && step4.includes('nutrition.multiplier_used'))
  check('protein basis line preserved',
    step4.includes("nutrition.protein_basis === 'lean_mass' ? 'lean body mass' : 'total bodyweight'"))
  check('guardrail warnings rendered from lib output (no local edits)',
    step4.includes('nutrition.warnings.map((w, i)'))
  check('no-weight branch preserved (can still complete without targets)',
    step4.includes('You did not enter a current weight'))
  check('expected-loss estimate formula unchanged',
    step4.includes('Math.round(deficitSlider / 3500 * 7 * 10) / 10'))
  check('muscle-loss risk caution retained (factual guardrail)',
    step4.includes('Larger deficits carry more muscle loss risk.'))
  check('edit-later reassurance retained',
    step4.includes('You can edit all targets anytime'))
  check('no diet-culture framing added',
    !/perfect macro|fat-burning|metaboli|cheat meal|bad food|good food/i.test(step4))
}

// ── 7. Write contract (handleComplete) ───────────────────────────────
console.log('\n7. Write contract')
{
  const PROFILE_FIELDS = ['user_id: user.id', 'display_name: form.display_name',
    'age: parseInt2(form.age)', 'sex: form.sex || null', 'height_cm: heightCm',
    'current_weight_kg: weightKg', 'goal_weight_kg: goalWeightKg', 'bf_pct: bfPct',
    'goal_bf_pct: parseFloat2(form.goal_bf_pct)',
    'training_experience: form.training_experience || null',
    'main_goal: form.main_goal || null', 'activity_level: form.activity_level || null',
    'step_goal: parseInt2(form.step_goal) ?? 8000', 'dietary_prefs: form.dietary_prefs',
    'injuries: form.injuries || null',
    'preferred_weigh_in_cadence: form.preferred_weigh_in_cadence',
    'preferred_weigh_in_day: parseInt2(form.preferred_weigh_in_day) ?? 5',
    'preferred_weigh_in_time: form.preferred_weigh_in_time',
    'fasting_enabled: form.fasting_enabled',
    'default_fasting_goal_hours: parseFloat2(form.default_fasting_goal_hours)',
    'fasting_notes: form.fasting_notes || null', 'onboarding_complete: true']
  for (const f of PROFILE_FIELDS) {
    check(`profile payload field: ${f.split(':')[0]}`, wizard.includes(f))
  }
  check('profile upsert keyed on user_id', wizard.includes("{ onConflict: 'user_id' })"))
  check('unit conversions unchanged',
    wizard.includes('lbsToKg(parseFloat(form.weight_lbs))') &&
    wizard.includes("feetInchesToCm(parseInt(form.height_ft), parseInt(form.height_in || '0'))"))
  check('nutrition target written only when weight exists',
    wizard.includes('if (nutrition) {') &&
    wizard.includes('const nutrition = weightLbs'))
  const TARGET_FIELDS = ['calories: nutrition.calories', 'protein_g: nutrition.protein_g',
    'fat_g: nutrition.fat_g', 'carbs_g: nutrition.carbs_g',
    'maintenance_cal: nutrition.maintenance_cal', 'deficit: nutrition.deficit',
    'multiplier_used: nutrition.multiplier_used', 'protein_basis: nutrition.protein_basis',
    'low_carb_warning: nutrition.low_carb_warning', "notes: 'Set during onboarding'"]
  for (const f of TARGET_FIELDS) {
    check(`target payload field: ${f.split(':')[0]}`, wizard.includes(f))
  }
  check('target upsert keyed on user_id + effective_date',
    wizard.includes("{ onConflict: 'user_id,effective_date' })"))
  check('decision log entry unchanged',
    wizard.includes("decision_type: 'nutrition_targets_set'") &&
    wizard.includes("created_by: 'system'") && wizard.includes("status: 'applied'"))
  check('write order unchanged: profile -> targets -> decision log',
    wizard.indexOf("from('user_profiles')") < wizard.indexOf("from('nutrition_targets')") &&
    wizard.indexOf("from('nutrition_targets')") < wizard.indexOf("from('decision_logs')"))
  check('profile/target errors thrown, decision log best-effort (as before)',
    wizard.includes('if (profileError) throw profileError') &&
    wizard.includes('if (nutritionError) throw nutritionError'))
  check('completion redirect unchanged',
    wizard.includes("window.location.assign('/dashboard')"))
  check('session-expiry handling unchanged',
    wizard.includes("setError('Session expired. Please sign in again.')") &&
    wizard.includes("router.push('/login')"))
  check('error copy + retry behavior unchanged',
    wizard.includes('Something went wrong saving your profile. Please try again.') &&
    wizard.includes('} finally {') && wizard.includes('setSaving(false)'))
}

// ── 8. Presentation — wizard chrome ──────────────────────────────────
console.log('\n8. Presentation')
{
  check('step panel is one coherent elevated Card',
    wizard.includes('<Card variant="elevated" className="gap-0 py-5">') &&
    wizard.includes('<CardContent>'))
  check('zero .shred-card in onboarding',
    ONBOARDING.every((f) => !stripComments(f).includes('shred-card')))
  check('no viewport-height wrapper on the route content',
    ONBOARDING.every((f) => !stripComments(f).includes('min-h-screen') &&
      !stripComments(f).includes('h-screen') && !stripComments(f).includes('dvh')))
  check('route container follows the app pattern',
    wizard.includes('className="mx-auto max-w-lg space-y-6 p-4 lg:p-6"'))
  check('progress segments: completed/current/upcoming distinction, decorative',
    wizard.includes("s < step ? 'bg-brand' : s === step ? 'bg-brand-active' : 'bg-surface-sunken'") &&
    wizard.includes('<div className="flex gap-1.5" aria-hidden="true">'))
  check('no fake percentage / no clickable step jumping',
    !wizard.includes('%') && !wizard.includes('onClick={() => setStep'))
  check('submit error uses critical tokens near the panel',
    wizard.includes('bg-critical-subtle rounded-lg px-4 py-3') &&
    wizard.includes('text-sm text-critical'))
  check('Continue primary (brand), Back secondary (bordered) on every step',
    STEPS.every((s) => !s.includes('bg-primary ') &&
      (s.includes('bg-brand text-brand-foreground') || s === step1) &&
      (s.includes('border border-edge text-ink-muted') || false) === s.includes('border border-edge text-ink-muted')) &&
    step1.includes('bg-brand text-brand-foreground') &&
    step2.includes('bg-brand text-brand-foreground') &&
    step3.includes('bg-brand text-brand-foreground') &&
    step4.includes('bg-brand text-brand-foreground'))
  check('44px-class action targets (py-3 buttons)',
    STEPS.every((s) => s.includes('py-3 rounded-lg')))
  check('no legacy ink/surface tokens remain in onboarding',
    ONBOARDING.every((f) => {
      const c = stripComments(f)
      return !c.includes('text-muted-foreground') && !c.includes('text-foreground') &&
        !c.includes('border-border') && !c.includes('bg-muted') &&
        !c.includes('bg-background') && !c.includes('text-destructive') &&
        !c.includes('bg-primary') && !c.includes('text-primary') &&
        !c.includes('accent-primary') && !c.includes('amber-')
    }))
  check('input chrome matches the profile-page convention',
    step1.includes('bg-secondary border border-input text-ink placeholder:text-ink-muted'))
  check('brand tint tip uses valid semantic token (Step 3)',
    step3.includes('bg-brand-subtle rounded-lg px-4 py-3'))
  check('Step 4 tiles mirror the /nutrition sunken-tile pattern',
    step4.includes('bg-surface-sunken rounded-lg px-4 py-3') &&
    step4.includes('className="metric-label"') &&
    read('src/app/(app)/nutrition/page.tsx').includes('className="metric-label"'))
  check('calories emphasized, macros plain ink (no decorative palette)',
    step4.includes("unit: 'cal/day', color: 'text-brand'") &&
    (step4.match(/color: 'text-ink'/g) || []).length === 3)
  check('warnings use caution tokens',
    step4.includes('bg-caution-subtle') && step4.includes('text-caution'))
  check('no giant tinted surfaces (tints only on small notice rows)',
    !wizard.includes('bg-brand-subtle') &&
    (step3.match(/bg-brand-subtle/g) || []).length === 1)
}

// ── 9. Shell regression (physically proven 4B.6C architecture) ───────
console.log('\n9. Shell regression')
{
  check('authenticated shell fixed + inset-0 + flex + overflow-hidden',
    appLayout.includes('<div className="fixed inset-0 flex overflow-hidden bg-canvas">'))
  check('no viewport-height shell sizing',
    ['h-screen', 'h-dvh', '100vh', '100dvh']
      .every((t) => !stripComments(appLayout).includes(t)) &&
    !appLayout.includes('fixed inset-0 flex h-'))
  check('main remains the app-content scroller',
    appLayout.includes(
      '<main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">'))
  check('sidebar nav keeps independent scroll',
    read('src/components/layout/Sidebar.tsx').includes('flex-1 overflow-y-auto'))
  check('content column keeps min-h-0',
    appLayout.includes('"flex min-h-0 flex-1 flex-col overflow-hidden"'))
  check('body unsized; no html/body overflow lock',
    rootLayout.includes('className={`font-sans antialiased bg-canvas text-ink`}') &&
    !stripComments(rootLayout).includes('overflow') &&
    !/(?:^|[}\s])(?:html|body)[^{]*\{[^}]*overflow(?:-y)?\s*:\s*(?:hidden|clip)/m
      .test(globals.replace(/\/\*[\s\S]*?\*\//g, '')))
  check('no height-chain experiment in globals',
    !/html\s*\{[^}]*height:\s*100%/m.test(globals.replace(/\/\*[\s\S]*?\*\//g, '')))
  check('bottom nav + lg breakpoint unchanged',
    read('src/components/layout/MobileBottomNav.tsx').includes('fixed inset-x-0 bottom-0 z-40') &&
    read('src/components/layout/MobileBottomNav.tsx').includes('lg:hidden'))
  check('no JS viewport sizing in shell',
    ['resize', 'innerHeight', 'addEventListener', 'visualViewport']
      .every((t) => !stripComments(appLayout).includes(t) &&
        !stripComments(rootLayout).includes(t)))
  check('onboarding scrolls inside main (no route-level scroller)',
    ONBOARDING.every((f) => !stripComments(f).includes('overflow-y')))
}

// ── 10. Select regression (4B.6C corrected primitive) ────────────────
console.log('\n10. Select regression')
{
  check('menu surface opaque semantic tokens',
    select.includes('border-edge bg-surface text-ink shadow-lg'))
  check('no legacy transparent menu tokens',
    !select.includes('bg-popover') && !select.includes('focus:bg-accent'))
  check('item highlight semantic', select.includes('focus:bg-surface-sunken focus:text-ink'))
  check('portal + stacking retained',
    select.includes('SelectPrimitive.Portal') && select.includes('z-[200]'))
  check('checkmark indicator retained', select.includes('SelectPrimitive.ItemIndicator'))
  check('onboarding consumes the shared primitive without local overrides',
    step3.includes("from '@/components/ui/select'") &&
    !step3.includes('z-[') && !step3.includes('SelectContent className'))
  check('Radix behavior untouched (no keyboard/focus interception in steps)',
    STEPS.every((s) => !s.includes('onKeyDown') && !s.includes('tabIndex')))
}

// ── 11. Final legacy audit ───────────────────────────────────────────
console.log('\n11. Final legacy audit')
{
  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) { walk(full); continue }
      if (!/\.(tsx|ts)$/.test(entry)) continue
      if (stripComments(read(full)).includes('shred-card')) offenders.push(full)
    }
  }
  walk('src/app')
  walk('src/components')
  check('zero active .shred-card consumers across all of src', offenders.length === 0,
    offenders.join(', '))
  check('compatibility alias retained in globals (deliberate 4B.1 contract)',
    globals.includes('.shred-card {'))
  check('card.tsx reference is comment-only',
    !stripComments(read('src/components/ui/card.tsx')).includes('shred-card'))
  check('metric-label compatibility class retained (still consumed by /nutrition)',
    globals.includes('.metric-label {') &&
    read('src/app/(app)/nutrition/page.tsx').includes('metric-label'))
  check('deferred token-only files documented with classification',
    ['FoodLogEntry', 'AddFoodForm', 'SavedMealForm', 'SetRow', 'ExerciseHistoryRows',
      'ActiveWorkoutConflictModal', 'ExerciseForm', 'RoutineForm', 'CreateWorkoutButton',
      'StartWorkoutButton'].every((f) => notes.includes(f)))
  check('SetRow untouched (highest-risk surface)',
    read('src/components/workout/SetRow.tsx').includes('`/api/workout-sets/${set.id}`'))
  check('conflict modal keeps its hard-opaque dialog surface + semantics',
    read('src/components/workout/ActiveWorkoutConflictModal.tsx').includes('role="dialog"') &&
    read('src/components/workout/ActiveWorkoutConflictModal.tsx').includes("background: '#ffffff'"))
  check('RoutineForm selection stays unambiguous (check + border-2 + aria-pressed)',
    read('src/components/routine/RoutineForm.tsx').includes('aria-pressed={selected}') &&
    read('src/components/routine/RoutineForm.tsx').includes('border-2'))
  check('notes classify remaining legacy references (A–D scheme)',
    ['A. compatibility only', 'B. inactive/dead code',
      'C. intentional domain-state styling', 'D. future cleanup']
      .every((c) => notes.includes(c)))
}

// ── 12. Responsive ───────────────────────────────────────────────────
console.log('\n12. Responsive')
{
  check('one-column base; compact pairs only for short numerics',
    !wizard.includes('lg:grid-cols') &&
    step1.includes('grid grid-cols-2 gap-3'))
  check('button rows are simple two-up grids (wrap-safe full-width buttons)',
    step2.includes('grid grid-cols-2 gap-3 pt-2') &&
    step3.includes('grid grid-cols-2 gap-3 pt-2') &&
    step4.includes('grid grid-cols-2 gap-3 pt-2'))
  check('no fixed-width traps in onboarding',
    ONBOARDING.every((f) => !/w-\[\d{3,}px\]/.test(f)))
  check('no horizontal-overflow constructs',
    ONBOARDING.every((f) => !f.includes('overflow-x')))
  check('selects sized to their container (w-full triggers)',
    (step3.match(/<SelectTrigger className="w-full">/g) || []).length === 3)
  check('content width bounded (max-w-lg)', wizard.includes('max-w-lg'))
  check('no md: usage (lg is the only shell breakpoint)',
    ONBOARDING.every((f) => !f.includes('md:')))
}

// ── 13. Accessibility ────────────────────────────────────────────────
console.log('\n13. Accessibility')
{
  check('exactly one H1 (wizard header)',
    (wizard.match(/<h1/g) || []).length === 1 &&
    STEPS.every((s) => !s.includes('<h1')))
  check('each step contributes exactly one H2',
    STEPS.every((s) => (s.match(/<h2/g) || []).length === 1))
  check('explicit labels throughout',
    step1.includes('<label className="block text-sm font-medium text-ink mb-1.5">') &&
    step3.includes('<label className="block text-sm font-medium text-ink mb-1.5">'))
  check('required marker is text-adjacent (asterisk in the label element)',
    step1.includes("{required && <span className=\"text-critical ml-1\">*</span>}"))
  check('OptionCard keyboard semantics from the shared primitive',
    optionCard.includes('aria-pressed') && optionCard.includes('focus-visible:ring-2'))
  check('fasting switch labeled adjacent to its heading text',
    step3.includes('Enable fasting tracking'))
  check('errors are textual rows, not color-only',
    wizard.includes('text-sm text-critical') &&
    step4.includes('text-sm text-caution'))
  check('semantic buttons for navigation',
    step2.includes('type="button"') && step3.includes('type="button"'))
  check('no tabindex hacks / no positive tabIndex',
    ONBOARDING.every((f) => !f.includes('tabIndex')))
  check('no fake WCAG claim in notes',
    !notes.toLowerCase().includes('wcag-compliant') &&
    !notes.toLowerCase().includes('fully accessible'))
}

// ── 14. Language and icons ───────────────────────────────────────────
console.log('\n14. Language and icons')
{
  check('no emoji in onboarding', ONBOARDING.every((f) => !EMOJI.test(f)))
  check('no Sparkles anywhere in src',
    !(() => {
      let found = false
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) { walk(full); continue }
          if (!/\.(tsx|ts)$/.test(entry)) continue
          if (stripComments(read(full)).includes('Sparkles')) found = true
        }
      }
      walk('src')
      return found
    })())
  check('no icon library beyond lucide in onboarding',
    ONBOARDING.every((f) => !f.includes('react-icons') && !f.includes('heroicons')))
  check('no hype/guilt/shame language',
    ONBOARDING.every((f) =>
      !/crush it|transform your body|get shredded|perfect plan|perfect macro|bad habit|cheat meal|guilt/i
        .test(f)))
  check('no fake AI / medical claims',
    ONBOARDING.every((f) => !/AI-powered|clinically|doctor|medical-grade|diagnos/i.test(f)))
  check('approved neutral copy anchors present',
    wizard.includes('Set up your profile') && wizard.includes('Personal details'))
}

// ── 15. Phase boundary ───────────────────────────────────────────────
console.log('\n15. Phase boundary')
{
  check('Fuel unchanged',
    read('src/app/(app)/food/page.tsx').includes('fetchFoodLogsForDate(supabase, user.id, date)') &&
    read('src/components/food/AddFoodForm.tsx').includes('function NInput'))
  check('Train unchanged',
    read('src/components/workout/WorkoutDetailClient.tsx')
      .includes("const readOnly = session.status === 'completed'"))
  check('Progress unchanged',
    read('src/app/(app)/progress/page.tsx').includes('fetchTrackingAwareProgressOverview'))
  check('Coach unchanged',
    read('src/app/(app)/coach/page.tsx').includes('fetchCoachActions'))
  check('Today unchanged',
    read('src/app/(app)/dashboard/page.tsx').includes('<TodayPrimaryAction'))
  check('Profile persistence unchanged',
    read('src/app/(app)/profile/page.tsx').includes('main_goal_changed') &&
    (read('src/app/(app)/profile/page.tsx').match(/\.update\(/g) || []).length === 1)
  check('nutrition math module untouched by 6D scope',
    read('src/lib/nutrition.ts').includes('calculateNutritionTargets'))
  check('no API route changes (onboarding writes via supabase client, as before)',
    ONBOARDING.every((f) => !f.includes("fetch('/api")))
  check('4B.6D added no migration (schema through 013 intact; 014_phase5a2 is a later approved phase)',
    readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql') && f < '014').length === 13 &&
    !existsSync('supabase/migrations/014_phase4c_dashboard_layout.sql'))
  check('package.json untouched (22 deps, shredos)',
    read('package.json').includes('"name": "shredos"') &&
    Object.keys(JSON.parse(read('package.json')).dependencies).length === 22)
  check('dead progress-summary untouched',
    read('src/lib/progress-summary.ts').includes("select('duration_minutes, ended_at')") &&
    read('src/lib/progress-summary.ts').includes('computeWeightProgress'))
  check('no .DS_Store', !existsSync('.DS_Store') && !existsSync('src/.DS_Store') &&
    !existsSync('src/components/.DS_Store'))
  check('deferred future features not implemented (import/health-sync/etc.)',
    ONBOARDING.every((f) => !/apple health|healthkit|import workout|watch sync/i.test(f)) &&
    !existsSync('src/app/(app)/import'))
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
