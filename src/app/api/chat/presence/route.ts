import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const now = new Date().toISOString()
    const presenceUpdate: Record<string, unknown> = {
      user_id: user.id,
      last_seen_at: now,
      is_visible: body?.visibility_state === 'visible',
      has_focus: Boolean(body?.has_focus),
      updated_at: now,
    }

    if (body?.activity_at) {
      presenceUpdate.last_interaction_at = new Date(String(body.activity_at)).toISOString()
    }

    const { error } = await admin.from('workspace_chat_user_profiles').upsert(
      presenceUpdate,
      { onConflict: 'user_id' },
    )
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error heartbeat:', error)
    return NextResponse.json({ error: 'Failed heartbeat' }, { status: 500 })
  }
}
