import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchRecentWeighIns,
  fetchCurrentNutritionTarget,
  fetchActiveFast,
  fetchRecentDecisions,
  fetchFastingLogsThisWeek,
  fetchFoodLogsForDate,
  fetchWorkoutWeekStats,
  fetchActivityLogForDate,
  findActiveTrainingSession,
} from '@/lib/supabase/server'
import { WeightCard } from '@/components/dashboard/WeightCard'
import { DailyMetricTile } from '@/components/dashboard/DailyMetricTile'
import { NutritionCard } from '@/components/dashboard/NutritionCard'
import { WorkoutCard } from '@/components/dashboard/WorkoutCard'
import { FastingCard } from '@/components/dashboard/FastingCard'
import { StepsCard } from '@/components/dashboard/StepsCard'
import { CoachCard } from '@/components/coach/CoachCard'
import { DecisionLogCard } from '@/components/dashboard/DecisionLogCard'
import { EnergyBalanceCard } from '@/components/dashboard/EnergyBalanceCard'
import { TodayPrimaryAction } from '@/components/dashboard/TodayPrimaryAction'
import { TodayWidget } from '@/components/dashboard/TodayWidget'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ArrowRight, Flame, Beef, SlidersHorizontal, LayoutGrid } from 'lucide-react'
import {
  normalizeDashboardPrefs,
  visibleDashboardWidgets,
  dashboardSpanClasses,
} from '@/lib/dashboard-prefs'
import { computeDailyTotals, computeNutritionProgress } from '@/lib/food'
import { computeFastingWeekStats } from '@/lib/fasting'
import { formatDateFull } from '@/lib/dates'
import { localTodayFromCookies, localHourFromCookies } from '@/lib/local-date-server'
import { fetchCoachSummary } from '@/lib/workout-coach'
import { fetchNutritionCoachSummary } from '@/lib/nutrition-coach'
import { fetchTodayEnergyBalance } from '@/lib/today-energy'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Today' }

// ============================================================
// ForgeFitOS — Today (Phase 4B.3 redesign)
//
// The first full route redesign on the 4B.1 design system + 4B.2
// shell. Hierarchy: header → primary training action → daily status
// grid → review area. Every query, domain calculation, and link
// destination from the legacy dashboard is preserved; the ONE
// addition is findActiveTrainingSession — the existing Phase 2K
// helper the workout APIs already use — so the page can lead with
// "resume your active workout". It throws on query failure (by
// design, for creation paths); here it is display-only, so a
// failure quietly falls back to the Start state — the API-level
// guard remains the authority when a workout is actually created.
//
// Fasting: the Fasting widget renders only when fasting_enabled
// (aligned with the 4B.2 navigation gating; the legacy dashboard
// showed a disabled "Off" card). It lives in the LOWER utility/
// review grid, whose lg column count adapts (3 with Fasting, 2
// without) so neither state orphans a row or reserves a blank
// slot. /fasting remains reachable directly; queries unchanged.
//
// Widget contract (Phase 4C prep): each domain section is wrapped
// in TodayWidget with a stable id — no customization, no
// persistence, no settings in this phase.
//
// UI-2 rebuild: same queries, same helpers, same actions — new
// composition. Personalized time-neutral greeting (no timezone is
// stored, so no morning/evening inference); calories/protein become
// metric tiles (derived once here with the stable food helpers —
// intake only, never net/earned calories); weight card gains the
// recorded-readings trend chart; the Energy Balance card moves from
// its one-child three-column row (the audited desktop-whitespace
// defect) into a balanced half-width region; Coach joins the widget
// contract as id="coach". Every prior widget id, action, link,
// mutation path, and honest empty state is preserved.
//
// UI-3: rendering is preference-driven. The stored dashboard_prefs
// document (untrusted) is normalized, product-gated (the fasting
// widget never renders when profile fasting is off, whatever the
// preference says), and mapped over a literal per-id registry — so
// enabled state controls visibility, array order controls DOM order,
// and size controls the responsive span (full=12 / half=6 /
// compact=4 desktop columns; one widget per row below sm). The page
// header and the workout hero are page chrome, NOT widgets: the hero
// shows only workout information, so a workout-only layout (all
// other widgets hidden) exposes nothing from hidden widgets. All 23
// bounded reads still run regardless of visibility — a deliberate
// choice: skipping reads for disabled widgets would fork the shared
// summary pipelines (coach/nutrition/energy) for a marginal saving
// and risk behavioral regressions. An all-disabled layout renders a
// recovery state with the Edit layout action.
// ============================================================

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Local-date fix: user-local calendar day and hour (timezone cookie).
  const today = localTodayFromCookies()

  const [profile, weighIns, nutritionTarget, activeFast, recentDecisions, weekFasts, todayFoodLogs, workoutStats, coachSummary, todayActivityLog, activeSession] =
    await Promise.all([
      fetchUserProfile(supabase, user.id),
      fetchRecentWeighIns(supabase, user.id, 20),
      fetchCurrentNutritionTarget(supabase, user.id),
      fetchActiveFast(supabase, user.id),
      fetchRecentDecisions(supabase, user.id, 5),
      fetchFastingLogsThisWeek(supabase, user.id),
      fetchFoodLogsForDate(supabase, user.id, today),
      fetchWorkoutWeekStats(supabase, user.id),
      fetchCoachSummary(supabase, user.id, today),
      fetchActivityLogForDate(supabase, user.id, today),
      // Display-only: a read failure hides the resume banner rather
      // than erroring the page; workout creation keeps its own guard.
      findActiveTrainingSession(supabase, user.id).catch(() => null),
    ])

  if (!profile || !profile.onboarding_complete) redirect('/onboarding')

  // Phase 1F: nutrition coaching summary
  // Uses already-fetched nutritionTarget + todayFoodLogs — no extra round-trips for those
  // Phase 5B.3: the Energy Balance view model reuses the same
  // already-fetched target/profile/today logs (its own bounded window
  // reads run inside the helper).
  const [nutritionCoachSummary, energyBalance] = await Promise.all([
    fetchNutritionCoachSummary(
      supabase, user.id, today, nutritionTarget, todayFoodLogs, profile.main_goal
    ),
    fetchTodayEnergyBalance(
      supabase, user.id, today, nutritionTarget, profile, todayFoodLogs
    ),
  ])

  const fastingStats = computeFastingWeekStats(weekFasts)
  const completedFasts = weekFasts.filter((f) => f.ended_at !== null)
  const lastCompletedFast = completedFasts[0] ?? null

  // Local-date fix: label the USER'S calendar day (formatDateFull
  // parses the date-only string locally — no UTC serialization).
  const todayLabel = formatDateFull(today)

  // UI-2 metric tiles: derived ONCE with the same stable pure helpers
  // NutritionCard uses (recorded intake vs target — no exercise
  // adjustment can enter this math). null target -> honest no-target
  // tile; no logs -> missing state, never zero.
  const tileTotals = computeDailyTotals(todayFoodLogs, today)
  const tileProgress = nutritionTarget
    ? computeNutritionProgress(tileTotals, nutritionTarget, localHourFromCookies())
    : null
  const hasFoodToday = todayFoodLogs.length > 0
  const fmtRemaining = (remaining: number, unit: string) =>
    remaining >= 0
      ? `${unit === '' ? Math.round(remaining).toLocaleString() : Math.round(remaining)}${unit} remaining`
      : `${unit === '' ? Math.round(Math.abs(remaining)).toLocaleString() : Math.round(Math.abs(remaining))}${unit} over`

  const greetingName = profile.display_name?.trim()

  // UI-3: normalize the stored (untrusted) preference document and
  // apply the product gate. Read failures upstream surface as a null
  // profile (redirect); a malformed/missing document normalizes to
  // the canonical defaults — Today never blanks because of bad JSON.
  const prefs = normalizeDashboardPrefs(profile.dashboard_prefs)
  const visibleWidgets = visibleDashboardWidgets(prefs, profile.fasting_enabled)

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 lg:p-6 xl:space-y-5">
      {/* ── Personalized header: time-neutral greeting (no stored
          timezone — investigation confirmed), real display name with
          neutral fallback, real date as the supporting line. ── */}
      <PageHeader
        title={greetingName ? `Welcome back, ${greetingName}` : 'Welcome back'}
        description={todayLabel}
        action={
          <>
            <Link href="/check-in" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Weekly review
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
            <Link href="/coach" className="inline-flex min-h-11 items-center gap-1 text-xs text-brand hover:underline">
              Coach
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
            {/* UI-3: the Edit layout control ships only now that it
                is functional. */}
            <Link
              href="/dashboard/customize"
              className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              Edit layout
            </Link>
          </>
        }
      />

      {/* ── Primary action (page-level hierarchy, not a widget —
          the workout widget id belongs to the status card below,
          so the mapping stays one-id-per-section) ── */}
      <TodayPrimaryAction
        activeSessionId={activeSession?.id ?? null}
        stats={workoutStats}
      />

      {/* ── Preference-driven widget grid (UI-3). Literal JSX per
          id keeps every widget's props/behavior identical to UI-2;
          only visibility, order, and span come from preferences.
          items-start preserves natural card heights. ── */}
      {(() => {
        const widgetRegistry: Record<string, JSX.Element> = {
          calories: (
            <TodayWidget id="calories">
              <DailyMetricTile
                icon={Flame}
                label="Calories"
                href="/food"
                linkLabel="Log food"
                value={hasFoodToday && tileProgress ? tileProgress.calories.consumed.toLocaleString() : null}
                targetLine={nutritionTarget ? `/ ${nutritionTarget.calories.toLocaleString()} cal` : null}
                barValue={hasFoodToday && tileProgress ? tileProgress.calories.consumed : null}
                barMax={nutritionTarget ? nutritionTarget.calories : null}
                barLabel="Calories recorded toward target"
                subline={hasFoodToday && tileProgress ? fmtRemaining(tileProgress.calories.remaining, '') : null}
                missingText={nutritionTarget ? 'No food logged yet today.' : 'No nutrition targets set.'}
              />
            </TodayWidget>
          ),
          protein: (
            <TodayWidget id="protein">
              <DailyMetricTile
                icon={Beef}
                label="Protein"
                href="/nutrition"
                linkLabel="Targets"
                value={hasFoodToday && tileProgress ? `${Math.round(Number(tileProgress.protein_g.consumed))}g` : null}
                targetLine={nutritionTarget ? `/ ${nutritionTarget.protein_g}g` : null}
                barValue={hasFoodToday && tileProgress ? Number(tileProgress.protein_g.consumed) : null}
                barMax={nutritionTarget ? nutritionTarget.protein_g : null}
                barLabel="Protein recorded toward target"
                subline={hasFoodToday && tileProgress ? fmtRemaining(Number(tileProgress.protein_g.remaining), 'g') : null}
                missingText={nutritionTarget ? 'No food logged yet today.' : 'No nutrition targets set.'}
              />
            </TodayWidget>
          ),
          steps: (
            <TodayWidget id="steps">
              <StepsCard stepGoal={profile.step_goal} todayLog={todayActivityLog} />
            </TodayWidget>
          ),
          weight: (
            <TodayWidget id="weight">
              <WeightCard weighIns={weighIns} profile={profile} />
            </TodayWidget>
          ),
          nutrition: (
            <TodayWidget id="nutrition">
              <NutritionCard
                target={nutritionTarget}
                todayLogs={todayFoodLogs}
                nutritionSummary={nutritionCoachSummary}
              />
            </TodayWidget>
          ),
          workout: (
            <TodayWidget id="workout">
              <WorkoutCard stats={workoutStats} />
            </TodayWidget>
          ),
          energy: (
            <TodayWidget id="energy">
              <EnergyBalanceCard model={energyBalance} />
            </TodayWidget>
          ),
          fasting: (
            <TodayWidget id="fasting">
              <FastingCard
                activeFast={activeFast}
                lastCompletedFast={lastCompletedFast}
                weekStats={fastingStats}
                fastingEnabled={profile.fasting_enabled}
              />
            </TodayWidget>
          ),
          coach: (
            <TodayWidget id="coach">
              <CoachCard summary={coachSummary} />
            </TodayWidget>
          ),
          decisions: (
            <TodayWidget id="decisions">
              <DecisionLogCard decision={recentDecisions[0] ?? null} />
            </TodayWidget>
          ),
        }

        if (visibleWidgets.length === 0) {
          // All widgets hidden — a valid layout. Purposeful recovery
          // state so the user can never lock themselves out.
          return (
            <EmptyState
              icon={<LayoutGrid className="h-8 w-8" aria-hidden="true" />}
              title="Your dashboard is empty"
              description="Every widget is hidden. Your data is still being tracked — bring widgets back whenever you want."
              action={
                <Link
                  href="/dashboard/customize"
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-brand px-4 text-sm font-semibold text-[hsl(var(--brand-foreground))] transition-colors hover:bg-brand-hover"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Edit layout
                </Link>
              }
            />
          )
        }

        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 xl:gap-5 items-start">
            {visibleWidgets.map((w) => (
              <div key={w.id} className={dashboardSpanClasses(w.size)}>
                {widgetRegistry[w.id]}
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
