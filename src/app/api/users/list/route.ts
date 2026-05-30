import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json([], { status: 401 })
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .neq('id', user.id)
      .order('full_name', { ascending: true })

    if (error) throw error

    return NextResponse.json(users || [])
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json([], { status: 500 })
  }
}
