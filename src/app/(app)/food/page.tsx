import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  fetchUserProfile,
  fetchFoodLogsForDate,
  fetchSavedMeals,
  fetchCurrentNutritionTarget,
} from '@/lib/supabase/server'
import { computeDailyTotals, computeNutritionProgress } from '@/lib/food'
import { DailyMacroSummary } from '@/components/food/DailyMacroSummary'
import { MealSection } from '@/components/food/MealSection'
import { QuickAddPanel } from '@/components/food/QuickAddPanel'
import { NutritionCoachPanel } from '@/components/nutrition/NutritionCoachPanel'
import { fetchNutritionCoachSummary } from '@/lib/nutrition-coach'
import { MEAL_TYPES } from '@/lib/constants'
import { todayISO } from '@/lib/dates'
import { format, addDays, parseISO, isToday, isFuture } from 'date-fns'
import type { Metadata } from 'next'
import type { MealType } from '@/types/database'

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
        className="p-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      <div className="text-center">
        <p className="text-base font-semibold text-foreground">
          {isCurrentToday ? 'Today' : format(current, 'EEEE, MMMM d')}
        </p>
        {!isCurrentToday && (
          <Link href="/food" className="text-xs text-primary hover:underline">
            Back to today
          </Link>
        )}
        {oldDate && (
          <p className="text-xs text-amber-400 mt-0.5">Logging more than 7 days ago</p>
        )}
      </div>

      <Link
        href={isNextFuture ? '#' : `/food?date=${next}`}
        className={`p-2 rounded-lg transition-colors ${
          isNextFuture ? 'opacity-30 pointer-events-none' : 'hover:bg-secondary'
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

  // Parallel fetch: all data needed for the food log page
  const [profile, logs, savedMeals, target] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchFoodLogsForDate(supabase, user.id, date),
    fetchSavedMeals(supabase, user.id),
    fetchCurrentNutritionTarget(supabase, user.id),
  ])

  if (!profile) redirect('/onboarding')

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
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Food log</h1>
        <Link href="/food/saved" className="text-xs text-primary hover:underline">
          Saved meals →
        </Link>
      </div>

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

      {/* Quick add panel */}
      <QuickAddPanel savedMeals={savedMeals} date={date} />
    </div>
  )
}
