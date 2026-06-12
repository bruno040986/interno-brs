import { redirect } from 'next/navigation'
import { getCurrentUserEffectivePermissions } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'

const providerRoutes = [
  { resource: 'sistema-config-empresa', href: '/rh/parceiros/config/provedores/empresas' },
  { resource: 'sistema-config-cnae', href: '/rh/parceiros/config/provedores/cnae' },
  { resource: 'sistema-config-ctn', href: '/rh/parceiros/config/provedores/ctn' },
  { resource: 'sistema-config-nbs', href: '/rh/parceiros/config/provedores/nbs' },
  { resource: 'sistema-config-comercial-tipos', href: '/rh/parceiros/config/provedores/tipos-comercial' },
  { resource: 'sistema-config-setores', href: '/rh/parceiros/config/provedores/setores' },
  { resource: 'sistema-config-nfse-emissao', href: '/rh/parceiros/config/provedores/tipos-emissao-nfse' },
  { resource: 'sistema-config-formas-recebimento', href: '/rh/parceiros/config/provedores/formas-recebimento' },
  { resource: 'sistema-config-tipos-sistemas', href: '/rh/parceiros/config/provedores/tipos-sistemas' },
  { resource: 'sistema-config-tipos-remuneracao', href: '/rh/parceiros/config/provedores/tipos-remuneracao' },
  { resource: 'sistema-config-email', href: '/rh/parceiros/config/provedores/email' },
  { resource: 'sistema-config-whatsapp', href: '/rh/parceiros/config/provedores/whatsapp' },
  { resource: 'sistema-config-assinatura', href: '/rh/parceiros/config/provedores/assinatura' },
  { resource: 'sistema-config-google', href: '/rh/parceiros/config/provedores/google' },
  { resource: 'sistema-config-regimes-tributarios', href: '/rh/parceiros/config/provedores/regimes-tributarios' },
  { resource: 'sistema-config-recalculo-tributario', href: '/rh/parceiros/config/provedores/recalculo-tributario' },
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
