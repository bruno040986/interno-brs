import { redirect } from 'next/navigation'
import { getCurrentUserEffectivePermissions } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { createEmptyAgenteCorbanDraft } from '@/lib/agente-corban'
import { getAgenteCorbanById, getAgenteCorbanLookups } from '../actions'
import AgenteCorbanEditorClient from '../_components/AgenteCorbanEditorClient'

export const dynamic = 'force-dynamic'

export default async function AgenteCorbanEditPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const permissions = await getCurrentUserEffectivePermissions()
  if (!hasPermission(permissions, 'agente-corban', 'can_view')) {
    redirect('/acesso-negado')
  }

  const resolvedParams = await params
  const [recordResult, lookupsResult] = await Promise.all([
    getAgenteCorbanById(resolvedParams.id),
    getAgenteCorbanLookups(),
  ])

  if (!recordResult.success) {
    redirect('/agente-corban')
  }

  return (
    <AgenteCorbanEditorClient
      key={recordResult.draft?.id || resolvedParams.id}
      initialDraft={recordResult.draft || createEmptyAgenteCorbanDraft()}
      initialLookups={lookupsResult.success ? lookupsResult : undefined}
    />
  )
}
