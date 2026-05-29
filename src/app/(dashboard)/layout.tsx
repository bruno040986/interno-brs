import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HubHeader from '@/components/layout/HubHeader'
import type { UserProfile } from '@/types'
import ThemeInit from '@/components/theme/ThemeInit'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="app-layout">
      <ThemeInit preference={(profile as any)?.theme_preference} />
      <HubHeader user={profile as UserProfile} />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
