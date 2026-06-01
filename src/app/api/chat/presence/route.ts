import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await admin.from('workspace_chat_user_profiles').upsert(
      {
        user_id: user.id,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error heartbeat:', error)
    return NextResponse.json({ error: 'Failed heartbeat' }, { status: 500 })
  }
}
