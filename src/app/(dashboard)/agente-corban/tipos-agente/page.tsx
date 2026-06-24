import { redirect } from 'next/navigation'
import { getCurrentUserEffectivePermissions } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { AGENTE_CORBAN_CATALOGS } from '@/lib/agente-corban'
import { getAgenteCorbanCatalogRows } from '../actions'
import AgenteCorbanCatalogManager from '../_components/AgenteCorbanCatalogManager'

export const dynamic = 'force-dynamic'

export default async function TiposAgentePage() {
  const permissions = await getCurrentUserEffectivePermissions()
  if (!hasPermission(permissions, 'agente-corban-tipos-agente', 'can_view')) {
    redirect('/acesso-negado')
  }

  const resource = 'agente-corban-tipos-agente' as const
  const result = await getAgenteCorbanCatalogRows(resource)
  const meta = AGENTE_CORBAN_CATALOGS.find((item) => item.resource === resource)!

  return (
    <AgenteCorbanCatalogManager
      resource={resource}
      title={meta.label}
      description="Cadastro leve usado na aba Acesso do editor."
      initialRows={result.success ? result.rows : []}
    />
  )
}
