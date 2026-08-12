import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateActivitySessionInput } from '@/lib/activity'

// ============================================================
// ForgeFitOS — Activity session correction/deletion (Phase 5A.3)
//
// Manual sessions must be correctable immediately (the fasting and
// workout lessons). Server-authoritative: ownership and the
// source='manual' rule are enforced here; 'live'/'imported' are
// reserved provenance values with no manual-correction UI yet, so
// the server rejects edits/deletes on them too. PATCH can never
// mutate id, user_id, source, or created_at — the update payload is
// built exclusively from validated, server-derived values.
// ============================================================

// Same local-date backstop rationale as the create route.
function serverTodayWithSkew(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().split('T')[0]
}

// The only keys a correction payload may carry — anything else is
// rejected explicitly rather than silently ignored (2M convention).
const EDITABLE_FIELDS = new Set([
  'activityType', 'activityDate', 'startTime', 'durationMinutes',
  'distanceMiles', 'caloriesBurned', 'notes',
])

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const unsupported = Object.keys(body).filter((k) => !EDITABLE_FIELDS.has(k))
  if (unsupported.length > 0) {
    return NextResponse.json(
      { error: 'Unsupported fields for activity correction.' },
      { status: 400 }
    )
  }

  const { data: session, error: fetchError } = await supabase
    .from('activity_sessions')
    .select('source')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.source !== 'manual') {
    return NextResponse.json(
      { error: 'Only manually logged activities can be edited.' },
      { status: 400 }
    )
  }

  const validation = validateActivitySessionInput(
    {
      activityType: body.activityType,
      activityDate: body.activityDate,
      startTime: body.startTime,
      durationMinutes: body.durationMinutes,
      distanceMiles: body.distanceMiles,
      caloriesBurned: body.caloriesBurned,
      notes: body.notes,
    },
    serverTodayWithSkew()
  )
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  const { activityType, activityDate, startedAt, durationSeconds,
    distanceMeters, caloriesBurned, notes } = validation

  // Same-row correction. Removing the start time clears started_at
  // back to NULL; blank distance/calories clear to NULL (0 calories
  // stays an explicit 0). source/status-free model: nothing else to
  // preserve — the row simply reflects the corrected facts.
  const { data, error } = await supabase
    .from('activity_sessions')
    .update({
      activity_type: activityType,
      activity_date: activityDate,
      started_at: startedAt?.toISOString() ?? null,
      duration_seconds: durationSeconds,
      distance_meters: distanceMeters,
      calories_burned: caloriesBurned,
      notes,
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session, error: fetchError } = await supabase
    .from('activity_sessions')
    .select('source')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.source !== 'manual') {
    return NextResponse.json(
      { error: 'Only manually logged activities can be deleted.' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('activity_sessions')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
