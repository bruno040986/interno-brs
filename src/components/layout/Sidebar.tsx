'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import {
  LayoutDashboard, Users, Bus, AlertTriangle,
  BookOpen, Building2, Upload, BarChart2,
  UserCog, ClipboardList, LogOut, Menu, X,
  FileText, Mail, MessageSquare, Globe, Key
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { UserProfile } from '@/types'
import { getEffectivePermissions } from '@/app/(dashboard)/usuarios/actions'

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPerms() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const res = await getEffectivePermissions(user.id)
          if (res.success) {
            setPermissions(res.permissions || [])
          }
        }
      } catch (err) {
        console.error('Erro ao carregar permissões na Sidebar:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPerms()
  }, [])

  const hasPermission = (resourceId: string): boolean => {
    if (loading) return true
    const perm = permissions.find(p => p.resource_name === resourceId)
    return perm ? !!perm.can_view : false
  }

  // Determinar itens do menu dinamicamente conforme o subsistema
  let navItems: any[] = []

  if (pathname === '/rh/parceiros/config/comercial') {
    // Subsistema: Estrutura Comercial
    navItems = [
      { section: 'Estrutura Comercial' },
      { label: 'Agentes Comerciais', href: '/rh/parceiros/config/comercial', icon: UserCog },
      { section: 'Sistema' },
      { label: 'Voltar ao Workspace', href: '/', icon: LayoutDashboard },
    ]
  } else if (pathname.startsWith('/rh/parceiros/config/provedores')) {
    // Subsistema: Configurações de API
    navItems = [
      { section: 'Configurações' },
      { label: 'API E-mail', href: '/rh/parceiros/config/provedores/email', icon: Mail },
      { label: 'API WhatsApp', href: '/rh/parceiros/config/provedores/whatsapp', icon: MessageSquare },
      { label: 'API Assinatura Eletrônica', href: '/rh/parceiros/config/provedores/assinatura', icon: FileText },
      { section: 'Integrações (Em breve)' },
      { label: 'Google', href: '/rh/parceiros/config/provedores/breve?api=Google', icon: Globe },
      { label: 'API QuarkRH', href: '/rh/parceiros/config/provedores/breve?api=QuarkRH', icon: Users },
      { label: 'API Conta Azul', href: '/rh/parceiros/config/provedores/breve?api=ContaAzul', icon: BarChart2 },
      { label: 'API ARW', href: '/rh/parceiros/config/provedores/breve?api=ARW', icon: Key },
      { label: 'API Instituições Financeiras', href: '/rh/parceiros/config/provedores/breve?api=Instituicoes', icon: Building2 },
      { label: 'API CRM', href: '/rh/parceiros/config/provedores/breve?api=CRM', icon: UserCog },
      { section: 'Sistema' },
      { label: 'Voltar ao Workspace', href: '/', icon: LayoutDashboard },
    ]
  } else if (pathname.startsWith('/rh/parceiros')) {
    // Subsistema: Cadastro de Parceiros (SCP)
    navItems = [
      { section: 'CRM Parceiros' },
      { label: 'CRM Parceiros', href: '/rh/parceiros', icon: Users },
      { label: 'Construtor de Formulário', href: '/rh/parceiros/config/formularios', icon: FileText },
      { label: 'Modelos e E-mails', href: '/rh/parceiros/config/templates', icon: Mail },
      { section: 'Sistema' },
      { label: 'Voltar ao Workspace', href: '/', icon: LayoutDashboard },
    ]
  } else {
    // Subsistema: Painel de Controle RH
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
    // Rotas exatas que não devem ativar por prefixo
    if (href === '/') return pathname === '/'
    if (href === '/rh') return pathname === '/rh'
    if (href === '/rh/parceiros') return pathname === '/rh/parceiros'
    if (href === '/rh/parceiros/config/comercial') return pathname === '/rh/parceiros/config/comercial'
    if (href?.includes('?')) return pathname + '?' === href.split('?')[0] + '?' || pathname === href.split('?')[0]
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Filtrar navItems com base nas permissões
  const filteredNavItems = navItems.filter(item => {
    if (item.section) return true

    if (item.href === '/rh/parceiros/config/comercial') {
      return hasPermission('comercial-agentes')
    }
    if (item.href === '/rh/parceiros/config/provedores/email') {
      return hasPermission('sistema-config-email')
    }
    if (item.href === '/rh/parceiros/config/provedores/whatsapp') {
      return hasPermission('sistema-config-whatsapp')
    }
    if (item.href === '/rh/parceiros/config/provedores/assinatura') {
      return hasPermission('sistema-config-assinatura')
    }
    if (item.href?.includes('Google')) {
      return hasPermission('sistema-config-google')
    }
    if (item.href?.includes('QuarkRH')) {
      return hasPermission('sistema-config-quarkrh')
    }
    if (item.href?.includes('ContaAzul')) {
      return hasPermission('sistema-config-contaazul')
    }
    if (item.href?.includes('ARW')) {
      return hasPermission('sistema-config-arw')
    }
    if (item.href?.includes('Instituicoes')) {
      return hasPermission('sistema-config-instituicoes')
    }
    if (item.href?.includes('CRM')) {
      return hasPermission('sistema-config-crm')
    }
    if (item.href === '/rh/parceiros') {
      return hasPermission('scp-crm')
    }
    if (item.href === '/rh/parceiros/config/formularios') {
      return hasPermission('scp-construtor')
    }
    if (item.href === '/rh/parceiros/config/templates') {
      return hasPermission('scp-emails')
    }
    
    // Itens do RH Geral
    if (item.href === '/rh/colaboradores' || item.href === '/rh/importacoes') {
      return hasPermission('workspace-rh')
    }
    if (item.href === '/rh/vale-transporte' || item.href === '/rh/medidas-disciplinares' || item.href === '/rh/motivos') {
      return hasPermission('workspace-rh')
    }
    if (item.href === '/rh/unidades' || item.href === '/rh/relatorios' || item.href === '/rh/auditoria') {
      return hasPermission('workspace-rh')
    }
    
    return true
  })

  // Limpar cabeçalhos de seção vazios
  const finalNavItems: any[] = []
  for (let i = 0; i < filteredNavItems.length; i++) {
    const current = filteredNavItems[i]
    if (current.section) {
      let hasContent = false
      for (let j = i + 1; j < filteredNavItems.length; j++) {
        if (filteredNavItems[j].section) break
        hasContent = true
      }
      if (hasContent) {
        finalNavItems.push(current)
      }
    } else {
      finalNavItems.push(current)
    }
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', top: '1rem', left: '1rem', zIndex: 50,
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
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 39 }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div style={{ height: '1.5rem' }} /> {/* Pequeno respiro no topo */}

        <nav className="sidebar-nav">
          {finalNavItems.map((item, idx) => {
            if ('section' in item) {
              return <div key={idx} className="sidebar-section-label">{item.section}</div>
            }
            const Icon = item.icon!
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`sidebar-link${isActive(item.href!) ? ' active' : ''}`}
              >
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
