import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ connected: false }, { status: 401 })
    }

    const { data } = await supabase
      .from('user_google_auth')
      .select('id')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ connected: !!data })
  } catch (error) {
    console.error('Error checking Google connection:', error)
    return NextResponse.json({ connected: false }, { status: 500 })
  }
}
