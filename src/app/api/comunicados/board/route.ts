import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { loadComunicadosBoard } from '@/lib/comunicados-service'

export async function GET() {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const items = await loadComunicadosBoard(admin, user.id)
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching comunicados board:', error)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}

