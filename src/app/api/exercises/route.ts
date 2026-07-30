import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { seedExercisesIfNeeded } from '@/lib/supabase/seed-exercises'
import { normalizeExerciseCreatePayload } from '@/lib/exercise-validation'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Seed on first request if needed
  await seedExercisesIfNeeded(supabase, user.id)

  const activeOnly = request.nextUrl.searchParams.get('active') !== 'false'
  let q = supabase.from('exercises').select('*').eq('user_id', user.id)
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

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: user.id,
      ...result.value,
      is_system: false,
    })
    .select().single()

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'You already have an exercise with this name.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
