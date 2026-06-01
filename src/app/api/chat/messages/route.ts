import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conversationId = request.nextUrl.searchParams.get('conversationId')
    if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

    const { data: membership } = await admin
      .from('workspace_chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: messages, error } = await admin
      .from('workspace_chat_messages')
      .select('id, sender_id, body, created_at, text_style, attachments')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const senderIds = [...new Set((messages || []).map((m) => m.sender_id))]
    const { data: users } = await admin.from('users').select('id, name, email').in('id', senderIds)
    const userMap = new Map((users || []).map((u) => [u.id, u]))

    const normalized = (messages || []).map((m) => {
      const sender = userMap.get(m.sender_id)
      return {
        id: m.id,
        text: m.body,
        timestamp: m.created_at,
        sender: {
          id: sender?.id || m.sender_id,
          email: sender?.email || '',
          full_name: sender?.name || undefined,
        },
        text_style: m.text_style || null,
        attachments: Array.isArray(m.attachments) ? m.attachments : [],
      }
    })

    await admin
      .from('workspace_chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)

    return NextResponse.json(normalized)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { conversationId, text, textStyle, attachments } = body as {
      conversationId?: string
      text?: string
      textStyle?: Record<string, unknown> | null
      attachments?: Array<Record<string, unknown>>
    }
    if (!conversationId || !text?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: membership } = await admin
      .from('workspace_chat_participants')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: inserted, error } = await admin
      .from('workspace_chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: text.trim(),
        text_style: textStyle || null,
        attachments: Array.isArray(attachments) ? attachments : [],
      })
      .select('id, body, created_at, text_style, attachments')
      .single()
    if (error) throw error

    const { data: sender } = await admin
      .from('users')
      .select('id, name, email')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      id: inserted.id,
      text: inserted.body,
      timestamp: inserted.created_at,
      sender: {
        id: sender?.id || user.id,
        email: sender?.email || '',
        full_name: sender?.name || undefined,
      },
      text_style: inserted.text_style || null,
      attachments: Array.isArray(inserted.attachments) ? inserted.attachments : [],
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
