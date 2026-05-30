import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMyCalendarEvents, getUserCalendarEvents } from '@/lib/google/calendar'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = request.nextUrl.searchParams.get('user')

    if (userEmail) {
      // Buscar eventos de outro usuário
      const events = await getUserCalendarEvents(user.id, userEmail)
      return NextResponse.json(events)
    } else {
      // Buscar eventos do próprio usuário
      const events = await getMyCalendarEvents(user.id)
      return NextResponse.json(events)
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch events' },
      { status: 500 },
    )
  }
}
