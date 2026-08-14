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
import { Flame, Beef } from 'lucide-react'
import { computeDailyTotals, computeNutritionProgress } from '@/lib/food'
import { computeFastingWeekStats } from '@/lib/fasting'
import { formatDateFull, todayISO } from '@/lib/dates'
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
// mutation path, and honest empty state is preserved. Fixed order —
// UI-3 makes it customizable.
// ============================================================

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = todayISO()

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

  const todayLabel = formatDateFull(new Date())

  // UI-2 metric tiles: derived ONCE with the same stable pure helpers
  // NutritionCard uses (recorded intake vs target — no exercise
  // adjustment can enter this math). null target -> honest no-target
  // tile; no logs -> missing state, never zero.
  const tileTotals = computeDailyTotals(todayFoodLogs, today)
  const tileProgress = nutritionTarget
    ? computeNutritionProgress(tileTotals, nutritionTarget, new Date().getHours())
    : null
  const hasFoodToday = todayFoodLogs.length > 0
  const fmtRemaining = (remaining: number, unit: string) =>
    remaining >= 0
      ? `${unit === '' ? Math.round(remaining).toLocaleString() : Math.round(remaining)}${unit} remaining`
      : `${unit === '' ? Math.round(Math.abs(remaining)).toLocaleString() : Math.round(Math.abs(remaining))}${unit} over`

  const greetingName = profile.display_name?.trim()

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
            <Link href="/check-in" className="text-xs text-brand hover:underline">
              Weekly review →
            </Link>
            <Link href="/coach" className="text-xs text-brand hover:underline">
              Coach →
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

      {/* ── Daily metric tiles: calories / protein / steps. One
          column on phones (readable at 320px), three across from sm.
          Calories = recorded intake only. Steps keeps its existing
          card, action path, and explicit-zero-vs-missing semantics. ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TodayWidget id="calories">
          <DailyMetricTile
            icon={Flame}
            label="Calories"
            href="/food"
            linkLabel="Log food →"
            value={hasFoodToday && tileProgress ? tileProgress.calories.consumed.toLocaleString() : null}
            targetLine={nutritionTarget ? `/ ${nutritionTarget.calories.toLocaleString()} cal` : null}
            barValue={hasFoodToday && tileProgress ? tileProgress.calories.consumed : null}
            barMax={nutritionTarget ? nutritionTarget.calories : null}
            barLabel="Calories recorded toward target"
            subline={hasFoodToday && tileProgress ? fmtRemaining(tileProgress.calories.remaining, '') : null}
            missingText={nutritionTarget ? 'No food logged yet today.' : 'No nutrition targets set.'}
          />
        </TodayWidget>
        <TodayWidget id="protein">
          <DailyMetricTile
            icon={Beef}
            label="Protein"
            href="/nutrition"
            linkLabel="Targets →"
            value={hasFoodToday && tileProgress ? `${Math.round(Number(tileProgress.protein_g.consumed))}g` : null}
            targetLine={nutritionTarget ? `/ ${nutritionTarget.protein_g}g` : null}
            barValue={hasFoodToday && tileProgress ? Number(tileProgress.protein_g.consumed) : null}
            barMax={nutritionTarget ? nutritionTarget.protein_g : null}
            barLabel="Protein recorded toward target"
            subline={hasFoodToday && tileProgress ? fmtRemaining(Number(tileProgress.protein_g.remaining), 'g') : null}
            missingText={nutritionTarget ? 'No food logged yet today.' : 'No nutrition targets set.'}
          />
        </TodayWidget>
        <TodayWidget id="steps">
          <StepsCard stepGoal={profile.step_goal} todayLog={todayActivityLog} />
        </TodayWidget>
      </div>

      {/* ── Main grid: deliberate 12-column desktop composition.
          Weight trend leads (8 cols) with a stacked detail rail (4
          cols); Energy always shares a balanced half-width row (the
          old one-child lg:grid-cols-3 row — the audited desktop
          whitespace defect — is gone). Fasting-enabled fills its
          half beside Energy with Coach/Decisions pairing below;
          disabled moves Decisions into the rail so no row is left
          half-empty in either state. ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 xl:gap-5">
        <div className="sm:col-span-2 lg:col-span-8">
          <TodayWidget id="weight">
            <WeightCard weighIns={weighIns} profile={profile} />
          </TodayWidget>
        </div>

        {/* Detail rail — top-aligned; unequal heights are accepted
            rather than stretching cards into internal dead space. */}
        <div className="grid gap-4 content-start sm:col-span-2 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 xl:gap-5">
          <TodayWidget id="nutrition">
            <NutritionCard
              target={nutritionTarget}
              todayLogs={todayFoodLogs}
              nutritionSummary={nutritionCoachSummary}
            />
          </TodayWidget>
          <TodayWidget id="workout">
            <WorkoutCard stats={workoutStats} />
          </TodayWidget>
          {!profile.fasting_enabled && (
            <div className="sm:col-span-2 lg:col-span-1">
              <TodayWidget id="decisions">
                <DecisionLogCard decision={recentDecisions[0] ?? null} />
              </TodayWidget>
            </div>
          )}
        </div>

        {/* Energy Balance (Phase 5B.3 semantics untouched): a
            balanced half-width region — never a one-card third. */}
        <div className="sm:col-span-1 lg:col-span-6">
          <TodayWidget id="energy">
            <EnergyBalanceCard model={energyBalance} />
          </TodayWidget>
        </div>

        {profile.fasting_enabled ? (
          <>
            <div className="sm:col-span-1 lg:col-span-6">
              <TodayWidget id="fasting">
                <FastingCard
                  activeFast={activeFast}
                  lastCompletedFast={lastCompletedFast}
                  weekStats={fastingStats}
                  fastingEnabled={profile.fasting_enabled}
                />
              </TodayWidget>
            </div>
            <div className="sm:col-span-1 lg:col-span-6">
              <TodayWidget id="coach">
                <CoachCard summary={coachSummary} />
              </TodayWidget>
            </div>
            <div className="sm:col-span-1 lg:col-span-6">
              <TodayWidget id="decisions">
                <DecisionLogCard decision={recentDecisions[0] ?? null} />
              </TodayWidget>
            </div>
          </>
        ) : (
          <div className="sm:col-span-1 lg:col-span-6">
            <TodayWidget id="coach">
              <CoachCard summary={coachSummary} />
            </TodayWidget>
          </div>
        )}
      </div>
    </div>
  )
}
