import { redirect } from 'next/navigation'
import { getCurrentUserEffectivePermissions } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'

const providerRoutes = [
  { resource: 'sistema-config-empresa', href: '/rh/parceiros/config/provedores/empresas' },
  { resource: 'sistema-config-email', href: '/rh/parceiros/config/provedores/email' },
  { resource: 'sistema-config-whatsapp', href: '/rh/parceiros/config/provedores/whatsapp' },
  { resource: 'sistema-config-assinatura', href: '/rh/parceiros/config/provedores/assinatura' },
  { resource: 'sistema-config-google', href: '/rh/parceiros/config/provedores/google' },
  { resource: 'sistema-config-quarkrh', href: '/rh/parceiros/config/provedores/breve?api=QuarkRH' },
  { resource: 'sistema-config-contaazul', href: '/rh/parceiros/config/provedores/breve?api=ContaAzul' },
  { resource: 'sistema-config-arw', href: '/rh/parceiros/config/provedores/breve?api=ARW' },
  { resource: 'sistema-config-instituicoes', href: '/rh/parceiros/config/provedores/breve?api=Instituicoes' },
  { resource: 'sistema-config-crm', href: '/rh/parceiros/config/provedores/breve?api=CRM' },
]

export default async function RedirectPage() {
  const permissions = await getCurrentUserEffectivePermissions()
  const firstRoute = providerRoutes.find((route) => hasPermission(permissions, route.resource))
  redirect(firstRoute?.href || '/acesso-negado')
}
