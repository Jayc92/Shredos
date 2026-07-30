import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lbsToKg } from '@/lib/units'
import { blockIfWorkoutSetCompleted } from '@/lib/supabase/workout-guards'

// Phase 2S: see the matching comment in
// workout-exercises/[id]/sets/route.ts for why this is duplicated
// rather than shared.
type TrackingMode = 'weight_reps' | 'bodyweight' | 'cardio' | 'timed'

const MODE_ALLOWED_FIELDS: Record<TrackingMode, ReadonlySet<string>> = {
  weight_reps: new Set(['reps', 'weight_lbs', 'weight_kg', 'rpe', 'is_warmup']),
  bodyweight:  new Set(['reps', 'weight_lbs', 'weight_kg', 'rpe', 'is_warmup']),
  cardio:      new Set(['duration_seconds', 'distance_meters']),
  timed:       new Set(['duration_seconds', 'rpe']),
}
const COMMON_FIELDS = new Set(['completed', 'notes'])

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutSetCompleted(supabase, params.id, user.id)
  if (locked) return locked

  // Phase 2S: fetch the existing set plus its exercise's current
  // tracking_mode before validating anything. A partial PATCH (e.g.
  // just {completed: true}) can only be validated correctly against
  // the FINAL merged state, not the request body in isolation.
  const { data: existing, error: fetchError } = await supabase
    .from('workout_sets')
    .select(`
      reps, weight_kg, rpe, is_warmup, completed, duration_seconds, distance_meters,
      workout_exercise:workout_exercises ( exercise:exercises ( tracking_mode ) )
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const trackingMode: TrackingMode | undefined =
    (existing as any).workout_exercise?.exercise?.tracking_mode
  if (!trackingMode) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))

  const allowed = new Set<string>([...MODE_ALLOWED_FIELDS[trackingMode], ...COMMON_FIELDS])
  const unsupported = Object.keys(body).filter((key) => !allowed.has(key))
  if (unsupported.length > 0) {
    return NextResponse.json(
      { error: "Only fields supported by this exercise's tracking mode can be updated." },
      { status: 400 }
    )
  }

  // Convert weight_lbs to weight_kg if provided — only reachable for
  // weight_reps/bodyweight, any other mode sending it was rejected above.
  let incomingWeightKg: number | null | undefined
  if (typeof body.weight_lbs === 'number') {
    incomingWeightKg = body.weight_lbs > 0 ? Math.round(lbsToKg(body.weight_lbs) * 100) / 100 : null
  } else if ('weight_kg' in body) {
    incomingWeightKg = body.weight_kg
  }

  // Merge the incoming body onto the existing row to compute the final
  // state, used only for completion validation below.
  const finalReps = 'reps' in body ? body.reps : (existing as any).reps
  const finalIsWarmup = 'is_warmup' in body ? body.is_warmup : (existing as any).is_warmup
  const finalCompleted = 'completed' in body ? body.completed : (existing as any).completed
  const finalDuration = 'duration_seconds' in body ? body.duration_seconds : (existing as any).duration_seconds

  // Phase 2S: per-mode completion requirements, validated against the
  // FINAL merged state, not just this request's own fields.
  if (finalCompleted) {
    if (trackingMode === 'bodyweight' && !finalIsWarmup && (finalReps === null || finalReps === undefined)) {
      return NextResponse.json({ error: 'Reps are required to complete this set.' }, { status: 400 })
    }
    if (trackingMode === 'cardio' || trackingMode === 'timed') {
      if (typeof finalDuration !== 'number' || finalDuration <= 0) {
        return NextResponse.json({ error: 'Duration is required to complete this set.' }, { status: 400 })
      }
    }
  }

  // Explicit normalized update. Beyond applying whatever this request
  // actually sent, this also self-heals any stale field left over from
  // a prior tracking_mode on this row — even if this specific PATCH
  // never touched it — so the row is always fully consistent with its
  // CURRENT mode after any successful write.
  const update: Record<string, unknown> = {}
  if ('completed' in body) update.completed = body.completed
  if ('notes' in body) update.notes = body.notes

  if (trackingMode === 'weight_reps' || trackingMode === 'bodyweight') {
    if ('reps' in body) update.reps = body.reps
    if (incomingWeightKg !== undefined) update.weight_kg = incomingWeightKg
    if ('rpe' in body) update.rpe = body.rpe
    if ('is_warmup' in body) update.is_warmup = body.is_warmup
    if ((existing as any).duration_seconds !== null) update.duration_seconds = null
    if ((existing as any).distance_meters !== null) update.distance_meters = null
  } else if (trackingMode === 'cardio') {
    if ('duration_seconds' in body) update.duration_seconds = body.duration_seconds
    if ('distance_meters' in body) update.distance_meters = body.distance_meters
    if ((existing as any).reps !== null) update.reps = null
    if ((existing as any).weight_kg !== null) update.weight_kg = null
    if ((existing as any).rpe !== null) update.rpe = null
    if ((existing as any).is_warmup !== false) update.is_warmup = false
  } else if (trackingMode === 'timed') {
    if ('duration_seconds' in body) update.duration_seconds = body.duration_seconds
    if ('rpe' in body) update.rpe = body.rpe
    if ((existing as any).reps !== null) update.reps = null
    if ((existing as any).weight_kg !== null) update.weight_kg = null
    if ((existing as any).distance_meters !== null) update.distance_meters = null
    if ((existing as any).is_warmup !== false) update.is_warmup = false
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workout_sets').update(update)
    .eq('id', params.id).select().single()
  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutSetCompleted(supabase, params.id, user.id)
  if (locked) return locked

  const { error } = await supabase
    .from('workout_sets').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
