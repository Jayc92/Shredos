import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/saved-meals/[id]/quick-add
 * Body: { date: string, meal_type?: string }
 *
 * Copies the saved meal's CURRENT macro values into a new food_logs row.
 * Later edits to the saved meal do NOT affect this log entry.
 * saved_meal_id on the log is traceability only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { date?: string; meal_type?: string }
  const logDate = body.date ?? new Date().toISOString().split('T')[0]

  // Fetch saved meal (RLS ensures user can only access their own)
  const { data: meal, error: fetchError } = await supabase
    .from('saved_meals')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !meal) {
    return NextResponse.json({ error: 'Saved meal not found' }, { status: 404 })
  }

  const mealType = body.meal_type ?? meal.meal_type_default ?? 'snack'

  // Insert food_log — macros copied at this moment
  const { data: log, error: logError } = await supabase
    .from('food_logs')
    .insert({
      user_id:      user.id,
      logged_date:  logDate,
      meal_type:    mealType,
      food_name:    meal.name,
      calories:     meal.calories,
      protein_g:    meal.protein_g,
      carbs_g:      meal.carbs_g,
      fat_g:        meal.fat_g,
      fiber_g:      meal.fiber_g,
      sugar_g:      meal.sugar_g,
      sodium_mg:    meal.sodium_mg,
      saved_meal_id: meal.id,
      notes:        null,
    })
    .select()
    .single()

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 })

  // Increment use_count and update last_used_at on saved_meal
  await supabase
    .from('saved_meals')
    .update({
      use_count:    (meal.use_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)

  return NextResponse.json({ data: log }, { status: 201 })
}
