export type PermissionAction =
  | 'can_view'
  | 'can_include'
  | 'can_edit'
  | 'can_delete'
  | 'can_activate_inactivate'

export type EffectivePermission = {
  resource_name: string
  can_view?: boolean | null
  can_include?: boolean | null
  can_edit?: boolean | null
  can_delete?: boolean | null
  can_activate_inactivate?: boolean | null
}

export type PermissionRequirement = {
  resource: string
  action?: PermissionAction
}

export type RouteAccessRule = {
  mode: 'all' | 'any'
  requirements: PermissionRequirement[]
}

export type RouteAccessDecision =
  | { type: 'open' }
  | { type: 'permission'; rule: RouteAccessRule }
  | { type: 'deny' }

const view = (resource: string): PermissionRequirement => ({ resource, action: 'can_view' })
const include = (resource: string): PermissionRequirement => ({ resource, action: 'can_include' })

export const providerBriefPermissionByApi: Record<string, string> = {
  google: 'sistema-config-google',
  quarkrh: 'sistema-config-quarkrh',
  contaazul: 'sistema-config-contaazul',
  arw: 'sistema-config-arw',
  instituicoes: 'sistema-config-instituicoes',
  crm: 'sistema-config-crm',
}

export const systemConfigRouteOptions: PermissionRequirement[] = [
  view('sistema-config-email'),
  view('sistema-config-whatsapp'),
  view('sistema-config-assinatura'),
  view('sistema-config-empresa'),
  view('sistema-config-google'),
  view('sistema-config-quarkrh'),
  view('sistema-config-contaazul'),
  view('sistema-config-arw'),
  view('sistema-config-instituicoes'),
  view('sistema-config-crm'),
]

const any = (requirements: PermissionRequirement[]): RouteAccessRule => ({
  mode: 'any',
  requirements,
})

const all = (requirements: PermissionRequirement[]): RouteAccessRule => ({
  mode: 'all',
  requirements,
})

const exactRouteRules: Record<string, RouteAccessRule> = {
  '/usuarios': any([view('sistema-usuarios-root')]),
  '/links': any([view('sistema-links')]),
  '/rh': any([view('rh-painel')]),
  '/api/import': any([include('rh-importacoes')]),
  '/rh/parceiros/config/provedores': any([view('sistema-config-email')]),
  '/rh/parceiros/config/empresas': any([view('sistema-config-empresa')]),
  '/rh/parceiros/config/provedores/empresas': any([view('sistema-config-empresa')]),
  '/rh/parceiros/config/provedores/email': any([view('sistema-config-email')]),
  '/rh/parceiros/config/provedores/whatsapp': any([view('sistema-config-whatsapp')]),
  '/rh/parceiros/config/provedores/assinatura': any([view('sistema-config-assinatura')]),
}

const prefixRouteRules: Array<[string, RouteAccessRule]> = [
  ['/rh/vale-transporte/novo', any([include('rh-vale-transporte')])],
  ['/rh/vale-transporte/opcao', any([include('rh-vale-transporte')])],
  ['/rh/vale-transporte/recusa', any([include('rh-vale-transporte')])],
  ['/rh/vale-transporte/visualizar', any([view('rh-vale-transporte')])],
  ['/rh/medidas-disciplinares/nova', any([include('rh-medidas-disciplinares')])],
  ['/rh/parceiros/config/comercial', any([view('comercial-agentes'), view('comercial-estrutura')])],
  ['/rh/parceiros/config/processos', any([view('scp-processos')])],
  ['/rh/parceiros/config/formularios', any([view('scp-construtor')])],
  ['/rh/parceiros/config/documentos', any([view('scp-documentos')])],
  ['/rh/parceiros/config/templates', any([view('scp-documentos')])],
  ['/rh/parceiros/config/emails', any([view('scp-emails')])],
  ['/rh/parceiros/config/whatsapp', any([view('scp-whatsapp')])],
  ['/rh/colaboradores', any([view('rh-colaboradores')])],
  ['/rh/importacoes', any([view('rh-importacoes')])],
  ['/rh/vale-transporte', any([view('rh-vale-transporte')])],
  ['/rh/medidas-disciplinares', any([view('rh-medidas-disciplinares')])],
  ['/rh/motivos', any([view('rh-motivos')])],
  ['/rh/unidades', any([view('rh-unidades')])],
  ['/rh/relatorios', any([view('rh-relatorios')])],
  ['/rh/auditoria', any([view('rh-auditoria')])],
  ['/rh/parceiros', any([view('scp-crm')])],
]

function normalizePath(pathname: string) {
  if (!pathname) return '/'
  const clean = pathname.split('?')[0] || '/'
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1)
  return clean
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function getRouteAccessDecision(
  pathname: string,
  searchParams?: URLSearchParams,
): RouteAccessDecision {
  const normalizedPath = normalizePath(pathname)

  if (normalizedPath === '/') return { type: 'open' }

  if (normalizedPath === '/rh/parceiros/config/provedores/breve') {
    const api = String(searchParams?.get('api') || '').trim().toLowerCase()
    const resource = providerBriefPermissionByApi[api]
    return resource ? { type: 'permission', rule: any([view(resource)]) } : { type: 'deny' }
  }

  const exactRule = exactRouteRules[normalizedPath]
  if (exactRule) return { type: 'permission', rule: exactRule }

  const prefixRule = prefixRouteRules
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => matchesPrefix(normalizedPath, prefix))

  if (prefixRule) return { type: 'permission', rule: prefixRule[1] }

  return { type: 'deny' }
}

export function hasPermission(
  permissions: readonly EffectivePermission[],
  resource: string,
  action: PermissionAction = 'can_view',
) {
  const permission = permissions.find((item) => item.resource_name === resource)
  return permission ? Boolean(permission[action]) : false
}

export function hasAnyPermission(
  permissions: readonly EffectivePermission[],
  requirements: readonly PermissionRequirement[],
) {
  return requirements.some((requirement) =>
    hasPermission(permissions, requirement.resource, requirement.action || 'can_view'),
  )
}

export function hasAllPermissions(
  permissions: readonly EffectivePermission[],
  requirements: readonly PermissionRequirement[],
) {
  return requirements.every((requirement) =>
    hasPermission(permissions, requirement.resource, requirement.action || 'can_view'),
  )
}

export function canAccessRoute(permissions: readonly EffectivePermission[], rule: RouteAccessRule) {
  return rule.mode === 'all'
    ? hasAllPermissions(permissions, rule.requirements)
    : hasAnyPermission(permissions, rule.requirements)
}

export const strictAll = all
