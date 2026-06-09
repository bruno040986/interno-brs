import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUserEffectivePermissions } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import type { ComunicadoProfile } from '@/lib/comunicados'
import { loadComunicadosCatalog } from '@/lib/comunicados-service'
import ComunicadosAdminClient from './ComunicadosAdminClient'

export const dynamic = 'force-dynamic'

export default async function ComunicadosPage() {
  const permissions = await getCurrentUserEffectivePermissions()
  if (!hasPermission(permissions, 'sistema-comunicados', 'can_view')) {
    redirect('/acesso-negado')
  }

  const admin = await createAdminClient()
  const [{ data: profiles }, items] = await Promise.all([
    admin.from('access_profiles').select('id, name').order('name', { ascending: true }),
    loadComunicadosCatalog(admin),
  ])

  return (
    <ComunicadosAdminClient
      profiles={(profiles || []) as ComunicadoProfile[]}
      initialItems={items}
    />
  )
}

