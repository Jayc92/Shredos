import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initializeExercisesIfNeeded } from '@/lib/supabase/deliver-catalog'
import { normalizeExerciseCreatePayload, deriveLegacyExerciseType } from '@/lib/exercise-validation'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Initialize on first request if needed (EXLIB-2T: the single
  // entry point — seed path while the delivery flag is OFF, which
  // is the strict default; delivery-first, fail-closed when ON)
  await initializeExercisesIfNeeded(supabase, user.id)

  const activeOnly = request.nextUrl.searchParams.get('active') !== 'false'
  // Phase 5A.6B: exercise_muscles (secondary/tertiary roles) is the
  // authoritative relationship read — the deprecated secondary_muscles
  // JSONB still arrives via * but is rollback insurance only.
  let q = supabase.from('exercises')
    .select('*, exercise_muscles(id, user_id, exercise_id, muscle, role, created_at)')
    .eq('user_id', user.id)
  if (activeOnly) q = q.eq('is_active', true)
  q = q.order('primary_muscle').order('name')

  const { data } = await q
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const result = normalizeExerciseCreatePayload(body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  // Phase 5A.6B: muscle_targets persist to exercise_muscles, never to
  // the exercise row (and never to the deprecated secondary_muscles
  // JSONB — no dual-write).
  const { muscle_targets, ...exerciseFields } = result.value

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: user.id,
      ...exerciseFields,
      // Phase 2R: exercise_type is no longer caller-supplied -- it's
      // derived from the validated tracking_mode so the legacy
      // NOT NULL/CHECK constraint stays satisfied.
      exercise_type: deriveLegacyExerciseType(result.value.tracking_mode),
      is_system: false,
    })
    .select().single()

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'You already have an exercise with this name.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (muscle_targets.length > 0) {
    const { error: targetsError } = await supabase
      .from('exercise_muscles')
      .insert(muscle_targets.map((t) => ({
        user_id: user.id,
        exercise_id: data.id,
        muscle: t.muscle,
        role: t.role,
      })))
    if (targetsError) {
      // Compensating cleanup — never a half-created exercise (the FK
      // cascade sweeps any partially inserted relationship rows).
      await supabase.from('exercises').delete().eq('id', data.id).eq('user_id', user.id)
      return NextResponse.json({ error: 'Could not save the exercise. Try again.' }, { status: 500 })
    }
  }

  return NextResponse.json({ data }, { status: 201 })
}
