import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeDurationSeconds } from '@/lib/workout'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nowIso = new Date().toISOString()

  // Phase 2J: read current start_time/completed_duration_seconds first,
  // so first completion can persist a duration while recompletion after
  // a correction (Phase 2I reopen) leaves an already-set value alone.
  //
  // NOTE: this read-then-write is NOT atomic against a concurrent
  // completion request for the same session -- acceptable for this
  // single-user app (see Phase 2J analysis). A genuinely concurrent
  // multi-device race could theoretically both read
  // completed_duration_seconds as null and both then write a computed
  // value; the worst outcome is two near-identical durations from
  // requests milliseconds apart, not corruption or data loss. Closing
  // this properly would need a database-side RPC (e.g. an UPDATE ...
  // SET completed_duration_seconds = COALESCE(completed_duration_seconds,
  // ...) in one statement) -- deliberately not introduced here, since
  // every other route in this app uses plain select/update/insert with
  // no stored procedures.
  const { data: existing, error: fetchError } = await supabase
    .from('workout_sessions')
    .select('start_time, completed_duration_seconds')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const update: Record<string, unknown> = { status: 'completed', end_time: nowIso }
  // Only set completed_duration_seconds when it isn't already present --
  // this is what makes recompletion after a correction preserve the
  // original duration instead of overwriting it with the (misleading)
  // correction-inflated elapsed time.
  if (existing.completed_duration_seconds == null && existing.start_time) {
    update.completed_duration_seconds = computeDurationSeconds(existing.start_time, nowIso)
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .update(update)
    .eq('id', params.id).eq('user_id', user.id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
