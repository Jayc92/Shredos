import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lbsToKg } from '@/lib/units'
import { blockIfWorkoutExerciseCompleted } from '@/lib/supabase/workout-guards'

// Phase 2S: per-tracking-mode allowed field sets, duplicated in both
// workout-set routes (this file and workout-sets/[id]/route.ts) rather
// than factored into a shared module, since the approved scope for
// this phase locks to exactly these two route files plus SetRow/
// WorkoutExerciseBlock/database.ts/the migration -- no new shared file.
type TrackingMode = 'weight_reps' | 'bodyweight' | 'cardio' | 'timed'

const MODE_ALLOWED_FIELDS: Record<TrackingMode, ReadonlySet<string>> = {
  weight_reps: new Set(['reps', 'weight_lbs', 'weight_kg', 'rpe', 'is_warmup']),
  bodyweight:  new Set(['reps', 'weight_lbs', 'weight_kg', 'rpe', 'is_warmup']),
  cardio:      new Set(['duration_seconds', 'distance_meters']),
  timed:       new Set(['duration_seconds', 'rpe']),
}
const COMMON_FIELDS = new Set(['completed', 'notes'])

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutExerciseCompleted(supabase, params.id, user.id)
  if (locked) return locked

  // Phase 2S: this workout_exercise's exercise tracking_mode determines
  // which fields are valid on the new set and how completion is
  // evaluated.
  const { data: we, error: weError } = await supabase
    .from('workout_exercises')
    .select('exercise:exercises ( tracking_mode )')
    .eq('id', params.id)
    .maybeSingle()
  if (weError) return NextResponse.json({ error: weError.message }, { status: 500 })
  const trackingMode: TrackingMode | undefined = (we as any)?.exercise?.tracking_mode
  if (!trackingMode) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))

  const allowed = new Set<string>([
    ...Array.from(MODE_ALLOWED_FIELDS[trackingMode]),
    ...Array.from(COMMON_FIELDS),
  ])
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key))
  if (unsupported.length > 0) {
    return NextResponse.json(
      { error: "Only fields supported by this exercise's tracking mode can be set." },
      { status: 400 }
    )
  }

  // Next set_number — unchanged, server-controlled.
  const { data: lastSet } = await supabase
    .from('workout_sets').select('set_number')
    .eq('workout_exercise_id', params.id)
    .order('set_number', { ascending: false }).limit(1).maybeSingle()
  const set_number = ((lastSet as any)?.set_number ?? 0) + 1

  // Accept weight_lbs (client standard) or weight_kg (internal override) —
  // only reachable for weight_reps/bodyweight, since any other mode
  // sending either key was already rejected above.
  let weight_kg: number | null = null
  if (typeof body.weight_lbs === 'number' && body.weight_lbs > 0) {
    weight_kg = Math.round(lbsToKg(body.weight_lbs) * 100) / 100
  } else if (typeof body.weight_kg === 'number') {
    weight_kg = body.weight_kg
  }

  const completed = body.completed ?? false
  const isWarmup = body.is_warmup ?? false

  // Phase 2S: per-mode completion requirements.
  if (completed) {
    if (trackingMode === 'bodyweight' && !isWarmup && (body.reps === null || body.reps === undefined)) {
      return NextResponse.json({ error: 'Reps are required to complete this set.' }, { status: 400 })
    }
    if (trackingMode === 'cardio' || trackingMode === 'timed') {
      const duration = typeof body.duration_seconds === 'number' ? body.duration_seconds : null
      if (duration === null || duration <= 0) {
        return NextResponse.json({ error: 'Duration is required to complete this set.' }, { status: 400 })
      }
    }
  }

  // Explicit, mode-correct insert — never a raw spread of body. Every
  // mode-inapplicable field is explicitly null/false, not merely
  // omitted, so the row is unambiguous regardless of what defaults
  // Supabase would otherwise apply.
  const insertPayload: Record<string, unknown> = {
    workout_exercise_id: params.id,
    set_number,
    completed,
    is_warmup: (trackingMode === 'cardio' || trackingMode === 'timed') ? false : isWarmup,
    notes: body.notes ?? null,
    reps: null,
    weight_kg: null,
    rpe: null,
    duration_seconds: null,
    distance_meters: null,
  }

  if (trackingMode === 'weight_reps' || trackingMode === 'bodyweight') {
    insertPayload.reps = body.reps ?? null
    insertPayload.weight_kg = weight_kg
    insertPayload.rpe = body.rpe ?? null
  } else if (trackingMode === 'cardio') {
    insertPayload.duration_seconds = typeof body.duration_seconds === 'number' ? body.duration_seconds : null
    insertPayload.distance_meters = typeof body.distance_meters === 'number' ? body.distance_meters : null
  } else if (trackingMode === 'timed') {
    insertPayload.duration_seconds = typeof body.duration_seconds === 'number' ? body.duration_seconds : null
    insertPayload.rpe = body.rpe ?? null
  }

  const { data, error } = await supabase
    .from('workout_sets')
    .insert(insertPayload)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
