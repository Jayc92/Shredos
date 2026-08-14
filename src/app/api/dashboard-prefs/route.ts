// ============================================================
// ForgeFitOS — Dashboard preferences persistence (UI-3)
// PUT /api/dashboard-prefs
//
// Follows the established route-handler convention (no server
// actions exist in this codebase; no service-role client exists
// anywhere): authenticated server client -> auth.getUser() -> 401,
// then an RLS-scoped update pinned to the authenticated user. The
// user id comes EXCLUSIVELY from the session — the client can never
// supply one. The browser-submitted document is untrusted: it is
// parsed and re-normalized server-side before storage, so malformed
// JSON can never reach the column. Only dashboard_prefs is written;
// no other profile field is touched. The Today route is revalidated
// so the next render reflects the saved layout.
// ============================================================

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { normalizeDashboardPrefs } from '@/lib/dashboard-prefs'

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown = null
  try {
    body = await request.json()
  } catch {
    // Malformed request JSON: normalization below turns null into the
    // canonical defaults — but a save of "whatever you sent was
    // unreadable" should be an explicit error, not a silent reset.
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Server-side re-normalization: the stored document is ALWAYS a
  // complete valid V1, regardless of what the browser sent.
  const prefs = normalizeDashboardPrefs(body)

  // .select() makes the update return the affected rows: a zero-row
  // result (profile row unexpectedly absent) must be a reported
  // failure, never a silent "success" that saved nothing.
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ dashboard_prefs: prefs })
    .eq('user_id', user.id)
    .select('user_id')

  if (error) {
    console.error('dashboard-prefs save error:', error)
    return NextResponse.json({ error: 'Could not save your layout.' }, { status: 500 })
  }
  if (!data || data.length === 0) {
    console.error('dashboard-prefs save affected no rows for user', user.id)
    return NextResponse.json(
      { error: 'Could not save your layout — profile not found.' },
      { status: 500 }
    )
  }

  revalidatePath('/dashboard')
  return NextResponse.json({ ok: true, prefs })
}
