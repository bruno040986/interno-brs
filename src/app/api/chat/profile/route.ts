import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await admin.from('users').select('id, name, email, avatar_url').eq('id', user.id).single()
    const { data: profile } = await admin
      .from('workspace_chat_user_profiles')
      .select('nickname, status, mood, mood_date, status_message, last_seen_at')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      user: me,
      profile: profile || null,
    })
  } catch (error) {
    console.error('Error fetching chat profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const nickname = body.nickname ? String(body.nickname).slice(0, 40) : null
    const status = ['online', 'busy', 'away'].includes(String(body.status)) ? String(body.status) : 'online'
    const mood = body.mood ? String(body.mood).slice(0, 20) : null
    const statusMessage = body.status_message ? String(body.status_message).slice(0, 50) : null
    const today = new Date().toISOString().slice(0, 10)

    const { error } = await admin.from('workspace_chat_user_profiles').upsert(
      {
        user_id: user.id,
        nickname,
        status,
        mood,
        mood_date: mood ? today : null,
        status_message: statusMessage,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating chat profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
