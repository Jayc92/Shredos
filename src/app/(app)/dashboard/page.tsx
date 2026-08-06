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
import { NutritionCard } from '@/components/dashboard/NutritionCard'
import { WorkoutCard } from '@/components/dashboard/WorkoutCard'
import { FastingCard } from '@/components/dashboard/FastingCard'
import { StepsCard } from '@/components/dashboard/StepsCard'
import { CoachCard } from '@/components/coach/CoachCard'
import { DecisionLogCard } from '@/components/dashboard/DecisionLogCard'
import { TodayPrimaryAction } from '@/components/dashboard/TodayPrimaryAction'
import { TodayWidget } from '@/components/dashboard/TodayWidget'
import { computeFastingWeekStats } from '@/lib/fasting'
import { formatDateFull, todayISO } from '@/lib/dates'
import { fetchCoachSummary } from '@/lib/workout-coach'
import { fetchNutritionCoachSummary } from '@/lib/nutrition-coach'
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
  const nutritionCoachSummary = await fetchNutritionCoachSummary(
    supabase, user.id, today, nutritionTarget, todayFoodLogs, profile.main_goal
  )

  const fastingStats = computeFastingWeekStats(weekFasts)
  const completedFasts = weekFasts.filter((f) => f.ended_at !== null)
  const lastCompletedFast = completedFasts[0] ?? null

  const todayLabel = formatDateFull(new Date())

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ink">Today</h1>
          <p className="text-sm text-ink-muted">{todayLabel}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/check-in" className="text-xs text-brand hover:underline">
            Weekly review →
          </Link>
          <Link href="/coach" className="text-xs text-brand hover:underline">
            Coach →
          </Link>
        </div>
      </div>

      {/* ── Primary action (page-level hierarchy, not a widget —
          the workout widget id belongs to the status card below,
          so the 4C mapping stays one-id-per-section) ── */}
      <TodayPrimaryAction
        activeSessionId={activeSession?.id ?? null}
        stats={workoutStats}
      />

      {/* ── Upper status grid: always exactly three lg columns
          (Nutrition / Weight / stacked Steps + Workout) so no
          conditional card can orphan a row. ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TodayWidget id="nutrition">
          <NutritionCard
            target={nutritionTarget}
            todayLogs={todayFoodLogs}
            nutritionSummary={nutritionCoachSummary}
          />
        </TodayWidget>
        <TodayWidget id="weight">
          <WeightCard weighIns={weighIns} profile={profile} />
        </TodayWidget>
        <div className="grid grid-cols-1 gap-4 content-start">
          <TodayWidget id="steps">
            <StepsCard stepGoal={profile.step_goal} todayLog={todayActivityLog} />
          </TodayWidget>
          <TodayWidget id="workout">
            <WorkoutCard stats={workoutStats} />
          </TodayWidget>
        </div>
      </div>

      {/* ── Lower utility/review grid: the conditional Fasting widget
          integrates here, and the column count adapts with it —
          three lg columns when Fasting renders (Fasting / Coach /
          Decisions), two when it does not (Coach / Decisions) — so
          the hidden state never reserves a blank slot and the
          enabled state never orphans a row. DOM/keyboard order:
          Fasting → Coach → Decisions. ── */}
      <div
        className={
          profile.fasting_enabled
            ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid grid-cols-1 gap-4 lg:grid-cols-2'
        }
      >
        {profile.fasting_enabled && (
          <TodayWidget id="fasting">
            <FastingCard
              activeFast={activeFast}
              lastCompletedFast={lastCompletedFast}
              weekStats={fastingStats}
              fastingEnabled={profile.fasting_enabled}
            />
          </TodayWidget>
        )}
        <CoachCard summary={coachSummary} />
        <TodayWidget id="decisions">
          <DecisionLogCard decision={recentDecisions[0] ?? null} />
        </TodayWidget>
      </div>
    </div>
  )
}
