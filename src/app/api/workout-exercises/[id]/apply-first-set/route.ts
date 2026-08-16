import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { blockIfWorkoutExerciseCompleted } from '@/lib/supabase/workout-guards'

// ============================================================
// ForgeFitOS — Apply first-set values to remaining sets (UI-5B1B)
// POST with an empty body. The server reads the CURRENT PERSISTED
// sets at execution time (never stale client props, so an in-flight
// blur save can never inject unsaved values), takes the first
// non-warmup set as the template, and fills ONLY blank fields on
// incomplete, non-warmup later sets. Copied fields are gated by the
// exercise's tracking mode; absent template values are omitted from
// the update entirely (blank never becomes zero); completed sets,
// warmups, notes, ids, numbering, and every nonblank value are never
// touched. Blank-only writes are idempotent, so a retry after a
// partial failure affects only the still-blank remainder.
// ============================================================

type TrackingMode = 'weight_reps' | 'bodyweight' | 'cardio' | 'timed'

const MODE_COPY_FIELDS: Record<TrackingMode, readonly string[]> = {
  weight_reps: ['reps', 'weight_kg', 'rpe'],
  bodyweight:  ['reps', 'weight_kg', 'rpe'],
  cardio:      ['duration_seconds', 'distance_meters'],
  timed:       ['duration_seconds', 'rpe'],
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const locked = await blockIfWorkoutExerciseCompleted(supabase, params.id, user.id)
  if (locked) return locked

  const { data: we, error: weError } = await supabase
    .from('workout_exercises')
    .select('exercise:exercises ( tracking_mode )')
    .eq('id', params.id)
    .maybeSingle()
  if (weError) return NextResponse.json({ error: 'Could not read the exercise.' }, { status: 500 })
  const trackingMode: TrackingMode | undefined = (we as any)?.exercise?.tracking_mode
  if (!trackingMode) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Deterministic template selection: ordered by set_number, then id
  // (the same tiebreak the resequencing function uses).
  const { data: sets, error: setsError } = await supabase
    .from('workout_sets')
    .select('id, set_number, reps, weight_kg, rpe, duration_seconds, distance_meters, completed, is_warmup')
    .eq('workout_exercise_id', params.id)
    .order('set_number', { ascending: true })
    .order('id', { ascending: true })
  if (setsError) return NextResponse.json({ error: 'Could not read the sets.' }, { status: 500 })

  const template = (sets ?? []).find((s: any) => !s.is_warmup)
  if (!template) {
    return NextResponse.json({ error: 'No working set to copy from.' }, { status: 400 })
  }

  const copyFields = MODE_COPY_FIELDS[trackingMode]
    .filter((f) => (template as any)[f] !== null && (template as any)[f] !== undefined)
  if (copyFields.length === 0) {
    return NextResponse.json(
      { error: "Enter and save the first set's values before applying them." },
      { status: 400 }
    )
  }

  // Eligible targets: later, non-warmup, incomplete sets with at
  // least one blank copyable field.
  const targets = (sets ?? []).filter((s: any) =>
    s.set_number > (template as any).set_number && !s.is_warmup && !s.completed &&
    copyFields.some((f) => s[f] === null))

  // Blank-only at WRITE time, not merely read time: every field is
  // written with its own IS NULL predicate, so a value the user
  // enters between this route's read and its write can never be
  // overwritten — the update simply matches zero rows for that field
  // and the entry is skipped honestly.
  let applied = 0
  let failed = 0
  for (const target of targets as any[]) {
    let wroteAnyField = false
    let targetFailed = false
    for (const f of copyFields) {
      if (target[f] !== null) continue
      const { data: written, error } = await supabase
        .from('workout_sets')
        .update({ [f]: (template as any)[f] })
        .eq('id', target.id)
        .is(f, null)
        .eq('completed', false)
        .select('id')
      if (error) targetFailed = true
      else if ((written ?? []).length > 0) wroteAnyField = true
    }
    if (targetFailed) failed++
    else if (wroteAnyField) applied++
  }

  // UI-5B1B stale-state correction: return the authoritative
  // POST-WRITE rows for the target sets so the client can reconcile
  // its visible inputs immediately, without waiting for (or
  // duplicating) a refresh fetch. A re-read, never an echo of the
  // template — per-field IS NULL predicates above mean a concurrent
  // user entry survives, and this read reports what actually landed.
  let updatedRows: Record<string, unknown>[] = []
  if (targets.length > 0) {
    const { data: reread } = await supabase
      .from('workout_sets')
      .select('id, reps, weight_kg, rpe, duration_seconds, distance_meters')
      .in('id', (targets as any[]).map((t) => t.id))
    updatedRows = reread ?? []
  }

  return NextResponse.json({
    data: { applied, eligible: targets.length, failed, sets: updatedRows },
  })
}
