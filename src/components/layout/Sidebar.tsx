'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  Bus,
  AlertTriangle,
  BookOpen,
  Building2,
  Upload,
  BarChart2,
  UserCog,
  ClipboardList,
  Menu,
  X,
  FileText,
  Mail,
  MessageSquare,
  Globe,
  Key,
} from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'
import { getMyEffectivePermissions } from '@/lib/auth/actions'
import { hasAnyPermission, hasPermission, type EffectivePermission } from '@/lib/auth/permissions'

type NavItem = {
  section?: string
  label?: string
  href?: string
  icon?: ComponentType<{ size?: number }>
}

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [permissions, setPermissions] = useState<EffectivePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [permissionsError, setPermissionsError] = useState(false)

  useEffect(() => {
    async function loadPerms() {
      try {
        const res = await getMyEffectivePermissions()
        if (res.success) {
          setPermissions(res.permissions || [])
          setPermissionsError(false)
        } else {
          setPermissionsError(true)
        }
      } catch (err) {
        console.error('Erro ao carregar permissões na Sidebar:', err)
        setPermissionsError(true)
      } finally {
        setLoading(false)
      }
    }

    loadPerms()
  }, [])

  const canView = (resourceId: string): boolean => {
    if (permissionsError) return false
    if (loading) return false
    return hasPermission(permissions, resourceId)
  }

  const canViewAny = (resourceIds: string[]): boolean => {
    if (permissionsError) return false
    if (loading) return false
    return hasAnyPermission(
      permissions,
      resourceIds.map((resource) => ({ resource })),
    )
  }

  let navItems: NavItem[] = []

  if (pathname === '/rh/parceiros/config/comercial') {
    navItems = [
      { section: 'Estrutura Comercial' },
      { label: 'Agentes Comerciais', href: '/rh/parceiros/config/comercial', icon: UserCog },
      { section: 'Sistema' },
      { label: 'Voltar ao Workspace', href: '/', icon: LayoutDashboard },
    ]
  } else if (pathname.startsWith('/rh/parceiros/config/provedores')) {
    navItems = [
      { section: 'Configurações' },
      { label: 'Cadastro da Empresa', href: '/rh/parceiros/config/provedores/empresas', icon: Building2 },
      { label: 'API E-mail', href: '/rh/parceiros/config/provedores/email', icon: Mail },
      { label: 'API WhatsApp', href: '/rh/parceiros/config/provedores/whatsapp', icon: MessageSquare },
      { label: 'API Assinatura Eletrônica', href: '/rh/parceiros/config/provedores/assinatura', icon: FileText },
      { label: 'Google', href: '/rh/parceiros/config/provedores/google', icon: Globe },
      { section: 'Integrações (Em breve)' },
      { label: 'API QuarkRH', href: '/rh/parceiros/config/provedores/breve?api=QuarkRH', icon: Users },
      { label: 'API Conta Azul', href: '/rh/parceiros/config/provedores/breve?api=ContaAzul', icon: BarChart2 },
      { label: 'API ARW', href: '/rh/parceiros/config/provedores/breve?api=ARW', icon: Key },
      { label: 'API Instituições Financeiras', href: '/rh/parceiros/config/provedores/breve?api=Instituicoes', icon: Building2 },
      { label: 'API CRM', href: '/rh/parceiros/config/provedores/breve?api=CRM', icon: UserCog },
      { section: 'Sistema' },
      { label: 'Voltar ao Workspace', href: '/', icon: LayoutDashboard },
    ]
  } else if (pathname.startsWith('/rh/parceiros')) {
    navItems = [
      { section: 'CRM Parceiros' },
      { label: 'CRM Parceiros', href: '/rh/parceiros', icon: Users },
      { label: 'Construtor de Processo', href: '/rh/parceiros/config/processos', icon: LayoutGrid },
      { label: 'Construtor de Formulário', href: '/rh/parceiros/config/formularios', icon: FileText },
      { section: 'Modelos' },
      { label: 'Modelos de Documentos', href: '/rh/parceiros/config/documentos', icon: FileText },
      { label: 'Modelos de E-mails', href: '/rh/parceiros/config/emails', icon: Mail },
      { label: 'Modelos de WhatsApp', href: '/rh/parceiros/config/whatsapp', icon: MessageSquare },
      { section: 'Sistema' },
      { label: 'Voltar ao Workspace', href: '/', icon: LayoutDashboard },
    ]
  } else {
    navItems = [
      { label: 'Painel RH', href: '/?sector=rh', icon: LayoutDashboard },
      { section: 'Colaboradores' },
      { label: 'Colaboradores', href: '/rh/colaboradores', icon: Users },
      { label: 'Importações', href: '/rh/importacoes', icon: Upload },
      { section: 'Documentos' },
      { label: 'Vale-Transporte', href: '/rh/vale-transporte', icon: Bus },
      { label: 'Medidas Disciplinares', href: '/rh/medidas-disciplinares', icon: AlertTriangle },
      { label: 'Motivos', href: '/rh/motivos', icon: BookOpen },
      { section: 'Configurações' },
      { label: 'Unidades', href: '/rh/unidades', icon: Building2 },
      { label: 'Relatórios', href: '/rh/relatorios', icon: BarChart2 },
      { label: 'Auditoria', href: '/rh/auditoria', icon: ClipboardList },
      { section: 'Sistema' },
      { label: 'Voltar ao Workspace', href: '/', icon: LayoutDashboard },
    ]
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    if (href === '/rh') return pathname === '/rh'
    if (href === '/rh/parceiros') return pathname === '/rh/parceiros'
    if (href === '/rh/parceiros/config/comercial') return pathname === '/rh/parceiros/config/comercial'
    if (href.includes('?')) return pathname + '?' === href.split('?')[0] + '?' || pathname === href.split('?')[0]
    return pathname === href || pathname.startsWith(href + '/')
  }

  const filteredNavItems = navItems.filter((item) => {
    if (item.section) return true

    if (item.href === '/rh/parceiros/config/comercial') return canViewAny(['comercial-agentes', 'comercial-estrutura'])
    if (item.href === '/') return true
    if (item.href === '/?sector=rh') return canView('workspace-rh')

    if (item.href === '/rh/parceiros/config/provedores/email') return canView('sistema-config-email')
    if (item.href === '/rh/parceiros/config/provedores/whatsapp') return canView('sistema-config-whatsapp')
    if (item.href === '/rh/parceiros/config/provedores/assinatura') return canView('sistema-config-assinatura')
    if (item.href === '/rh/parceiros/config/provedores/empresas') return canView('sistema-config-empresa')
    if (item.href === '/rh/parceiros/config/provedores/google') return canView('sistema-config-google')
    if (item.href?.includes('QuarkRH')) return canView('sistema-config-quarkrh')
    if (item.href?.includes('ContaAzul')) return canView('sistema-config-contaazul')
    if (item.href?.includes('ARW')) return canView('sistema-config-arw')
    if (item.href?.includes('Instituicoes')) return canView('sistema-config-instituicoes')
    if (item.href?.includes('CRM')) return canView('sistema-config-crm')

    if (item.href === '/rh/parceiros') return canView('scp-crm')
    if (item.href === '/rh/parceiros/config/processos') return canView('scp-processos')
    if (item.href === '/rh/parceiros/config/formularios') return canView('scp-construtor')
    if (item.href === '/rh/parceiros/config/documentos') return canView('scp-documentos')
    if (item.href === '/rh/parceiros/config/emails') return canView('scp-emails')
    if (item.href === '/rh/parceiros/config/whatsapp') return canView('scp-whatsapp')

    if (item.href === '/rh/colaboradores') return canView('rh-colaboradores')
    if (item.href === '/rh/importacoes') return canView('rh-importacoes')
    if (item.href === '/rh/vale-transporte') return canView('rh-vale-transporte')
    if (item.href === '/rh/medidas-disciplinares') return canView('rh-medidas-disciplinares')
    if (item.href === '/rh/motivos') return canView('rh-motivos')
    if (item.href === '/rh/unidades') return canView('rh-unidades')
    if (item.href === '/rh/relatorios') return canView('rh-relatorios')
    if (item.href === '/rh/auditoria') return canView('rh-auditoria')

    return false
  })

  const finalNavItems: NavItem[] = []
  for (let i = 0; i < filteredNavItems.length; i++) {
    const current = filteredNavItems[i]
    if (current.section) {
      let hasContent = false
      for (let j = i + 1; j < filteredNavItems.length; j++) {
        if (filteredNavItems[j].section) break
        hasContent = true
      }
      if (hasContent) finalNavItems.push(current)
    } else {
      finalNavItems.push(current)
    }
  }

  return (
    <>
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 50,
          display: 'none',
          background: 'var(--brs-navy)',
          color: '#fff',
          borderRadius: '8px',
        }}
        id="sidebar-toggle"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39 }} onClick={() => setOpen(false)} />
      )}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div style={{ height: '1.5rem' }} />

        <nav className="sidebar-nav">
          {finalNavItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={`section-${idx}`} className="sidebar-section-label">
                  {item.section}
                </div>
              )
            }
            const Icon = item.icon!
            return (
              <Link key={item.href} href={item.href!} className={`sidebar-link${isActive(item.href!) ? ' active' : ''}`}>
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
