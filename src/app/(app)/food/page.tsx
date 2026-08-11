import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchFoodLogsForDate,
  fetchRecentFoodLogs,
  fetchSavedMeals,
  fetchCurrentNutritionTarget,
} from '@/lib/supabase/server'
import { computeDailyTotals, computeNutritionProgress } from '@/lib/food'
import { DailyMacroSummary } from '@/components/food/DailyMacroSummary'
import { FuelSubNav } from '@/components/food/FuelSubNav'
import { MealSection } from '@/components/food/MealSection'
import { RecentFoodPanel } from '@/components/food/RecentFoodPanel'
import { QuickDrinkLog } from '@/components/food/QuickDrinkLog'
import { LabelCalculatorForm } from '@/components/food/LabelCalculatorForm'
import { QuickAddPanel } from '@/components/food/QuickAddPanel'
import { NutritionCoachPanel } from '@/components/nutrition/NutritionCoachPanel'
import { fetchNutritionCoachSummary } from '@/lib/nutrition-coach'
import { MEAL_TYPES } from '@/lib/constants'
import { todayISO } from '@/lib/dates'
import { format, addDays, subDays, parseISO, isToday, isFuture } from 'date-fns'
import type { Metadata } from 'next'
import type { FoodLog, MealType } from '@/types/database'

export const metadata: Metadata = { title: 'Food log' }

/** Date navigation — server component, uses Links, no client JS */
function DateNav({ date }: { date: string }) {
  const current = parseISO(date)
  const prev = format(addDays(current, -1), 'yyyy-MM-dd')
  const next = format(addDays(current, 1), 'yyyy-MM-dd')
  const isCurrentToday = isToday(current)
  const isNextFuture   = isFuture(addDays(current, 1)) && !isToday(addDays(current, 1))
  const oldDate = !isCurrentToday && Math.abs(
    (current.getTime() - new Date().getTime()) / 86_400_000
  ) > 7

  return (
    <div className="flex items-center justify-between">
      <Link
        href={`/food?date=${prev}`}
        className="p-2 rounded-lg hover:bg-surface-interactive transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      <div className="text-center">
        <p className="text-base font-semibold text-ink">
          {isCurrentToday ? 'Today' : format(current, 'EEEE, MMMM d')}
        </p>
        {!isCurrentToday && (
          <Link href="/food" className="text-xs text-brand hover:underline">
            Back to today
          </Link>
        )}
        {oldDate && (
          <p className="text-xs text-caution mt-0.5">Logging more than 7 days ago</p>
        )}
      </div>

      <Link
        href={isNextFuture ? '#' : `/food?date=${next}`}
        className={`p-2 rounded-lg transition-colors ${
          isNextFuture ? 'opacity-30 pointer-events-none' : 'hover:bg-surface-interactive'
        }`}
        aria-label="Next day"
        aria-disabled={isNextFuture}
      >
        <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  )
}

export default async function FoodPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const date    = searchParams.date ?? todayISO()
  const todayStr = todayISO()

  // Phase 1N: 14-day window for "recent foods", anchored to today (not the
  // viewed date) — "recent" is an absolute recency concept independent of
  // which date the user happens to be logging against.
  const fourteenDaysAgo = format(subDays(parseISO(todayStr), 13), 'yyyy-MM-dd')

  // Parallel fetch: all data needed for the food log page
  const [profile, logs, recentFoodRows, savedMeals, target] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchFoodLogsForDate(supabase, user.id, date),
    fetchRecentFoodLogs(supabase, user.id, fourteenDaysAgo, 60),
    fetchSavedMeals(supabase, user.id),
    fetchCurrentNutritionTarget(supabase, user.id),
  ])

  if (!profile) redirect('/onboarding')

  // Phase 1N: dedupe recentFoodRows down to distinct foods (by trimmed,
  // lowercased food_name). recentFoodRows is already ordered created_at
  // desc, so the first occurrence encountered for a given name is the
  // most recent one — no re-sorting needed. Capped to 10 distinct foods
  // for display.
  const recentFoodsByName = new Map<string, FoodLog>()
  for (const row of recentFoodRows) {
    const key = row.food_name.trim().toLowerCase()
    if (!recentFoodsByName.has(key)) {
      recentFoodsByName.set(key, row)
    }
  }
  const recentFoods = Array.from(recentFoodsByName.values()).slice(0, 10)

  // Phase 1F: nutrition coaching summary
  // Only fetched when viewing today — the panel is anchored to the current week
  // and today’s logs are needed to compute caloriesToday / proteinToday.
  const isViewingToday = date === todayStr
  const nutritionSummary = isViewingToday
    ? await fetchNutritionCoachSummary(
        supabase, user.id, todayStr, target, logs, profile.main_goal
      )
    : null

  const totals  = computeDailyTotals(logs, date)
  const nowHour = new Date().getHours()
  const progress = target ? computeNutritionProgress(totals, target, nowHour) : null

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Food log</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Log meals for the selected day and track daily totals.
        </p>
      </div>

      <FuelSubNav />

      {/* Phase 1F: coaching panel (today only, hidden until enough data) */}
      {nutritionSummary && (
        <NutritionCoachPanel summary={nutritionSummary} />
      )}

      {/* Date navigation */}
      <DateNav date={date} />

      {/* Daily macro progress */}
      <DailyMacroSummary
        progress={progress}
        target={target}
        compact={false}
      />

      {/* Quick shortcuts — saved-meal quick add + recent foods sit
          ahead of the meal sections (4B.6C hierarchy); the flows
          themselves are unchanged. */}
      <QuickAddPanel savedMeals={savedMeals} date={date} />
      <RecentFoodPanel recentFoods={recentFoods} date={date} />

      {/* Meal sections */}
      {MEAL_TYPES.map(({ value, label }) => (
        <MealSection
          key={value}
          mealType={value as MealType}
          label={label}
          entries={logs.filter((l) => l.meal_type === value)}
          date={date}
        />
      ))}

      {/* Secondary tools */}
      {/* Quick drink log — one aggregate row, e.g. "7 Bud Lights" */}
      <QuickDrinkLog date={date} />

      {/* Nutrition label calculator — per-serving label values x servings eaten */}
      <LabelCalculatorForm date={date} />
    </div>
  )
}
