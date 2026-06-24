import { redirect } from 'next/navigation'
import { getCurrentUserEffectivePermissions } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { getAgenteCorbanList, getAgenteCorbanLookups } from './actions'
import AgenteCorbanListClient from './_components/AgenteCorbanListClient'

export const dynamic = 'force-dynamic'

export default async function AgenteCorbanPage() {
  const permissions = await getCurrentUserEffectivePermissions()
  if (!hasPermission(permissions, 'agente-corban', 'can_view')) {
    redirect('/acesso-negado')
  }

  const [listResult, lookupsResult] = await Promise.all([
    getAgenteCorbanList(),
    getAgenteCorbanLookups(),
  ])

  return (
    <AgenteCorbanListClient
      initialItems={(listResult.success ? listResult.items : []) || []}
      companyProfiles={(lookupsResult.success ? lookupsResult.companyProfiles : []) || []}
    />
  )
}
