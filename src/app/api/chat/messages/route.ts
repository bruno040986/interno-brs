import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = request.nextUrl.searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    // Integração com Google Chat API futuramente
    // Por enquanto retorna array vazio
    const messages = []

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, text } = body

    if (!conversationId || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Integração com Google Chat API futuramente
    // Por enquanto simula uma mensagem criada
    const newMessage = {
      id: `msg-${Date.now()}`,
      text,
      timestamp: new Date().toISOString(),
      sender: {
        id: user.id,
        email: user.email,
      },
    }

    return NextResponse.json(newMessage)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
