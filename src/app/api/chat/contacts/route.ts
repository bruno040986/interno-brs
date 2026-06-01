import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await admin
      .from('users')
      .select('id, email, name, avatar_url')
      .eq('active', true)
      .neq('id', user.id)
      .order('name', { ascending: true })

    if (error) throw error

    const userIds = (data || []).map((u) => u.id)
    const { data: profiles } = await admin
      .from('workspace_chat_user_profiles')
      .select('user_id, nickname, status, mood, mood_date, status_message, last_seen_at')
      .in('user_id', userIds)

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]))
    const now = Date.now()

    return NextResponse.json(
      (data || []).map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.name || undefined,
        short_name: String(u.name || '')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .join(' '),
        avatar_url: u.avatar_url || null,
        nickname: profileMap.get(u.id)?.nickname || null,
        status: (() => {
          const p = profileMap.get(u.id)
          if (!p?.last_seen_at) return 'offline'
          const diff = now - new Date(p.last_seen_at).getTime()
          if (diff > 5 * 60 * 1000) return 'offline'
          return p.status || 'online'
        })(),
        mood: (() => {
          const p = profileMap.get(u.id)
          if (!p?.mood || !p?.mood_date) return null
          const today = new Date().toISOString().slice(0, 10)
          return p.mood_date === today ? p.mood : null
        })(),
        status_message: profileMap.get(u.id)?.status_message || null,
      })),
    )
  } catch (error) {
    console.error('Error fetching chat contacts:', error)
    return NextResponse.json([], { status: 500 })
  }
}
