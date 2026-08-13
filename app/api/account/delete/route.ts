import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = getServiceClient() as any

  // profiles.id references auth.users(id) on delete cascade, so deleting the auth user
  // alone removes the profile row and everything owned by it — no separate profile
  // delete step, which would otherwise risk orphaning the auth user on partial failure.
  const { error } = await service.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
