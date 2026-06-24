import { redirect } from 'next/navigation'
import { getCurrentUserEffectivePermissions } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { createEmptyAgenteCorbanDraft } from '@/lib/agente-corban'
import { getAgenteCorbanLookups } from '../actions'
import AgenteCorbanEditorClient from '../_components/AgenteCorbanEditorClient'

export const dynamic = 'force-dynamic'

export default async function NovaAgenteCorbanPage() {
  const permissions = await getCurrentUserEffectivePermissions()
  if (!hasPermission(permissions, 'agente-corban', 'can_include')) {
    redirect('/acesso-negado')
  }

  const lookupsResult = await getAgenteCorbanLookups()

  return (
    <AgenteCorbanEditorClient
      key="novo"
      initialDraft={createEmptyAgenteCorbanDraft()}
      initialLookups={lookupsResult.success ? lookupsResult : undefined}
    />
  )
}
