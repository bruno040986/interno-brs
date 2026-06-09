import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { loadComunicadosNotifications } from '@/lib/comunicados-service'

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await loadComunicadosNotifications(admin, user.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching comunicados notifications:', error)
    return NextResponse.json({ count: 0, items: [] }, { status: 500 })
  }
}

