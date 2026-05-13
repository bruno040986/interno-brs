'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import {
  LayoutDashboard, Users, Bus, AlertTriangle,
  BookOpen, Building2, Upload, BarChart2,
  UserCog, ClipboardList, LogOut, Menu, X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { UserProfile } from '@/types'

const navItems = [
  { label: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { section: 'Colaboradores' },
  { label: 'Colaboradores', href: '/colaboradores', icon: Users },
  { label: 'Importações', href: '/importacoes', icon: Upload },
  { section: 'Documentos' },
  { label: 'Vale-Transporte', href: '/vale-transporte', icon: Bus },
  { label: 'Medidas Disciplinares', href: '/medidas-disciplinares', icon: AlertTriangle },
  { label: 'Motivos', href: '/motivos', icon: BookOpen },
  { section: 'Configurações' },
  { label: 'Unidades', href: '/unidades', icon: Building2 },
  { label: 'Relatórios', href: '/relatorios', icon: BarChart2 },
  { label: 'Usuários', href: '/usuarios', icon: UserCog },
  { label: 'Auditoria', href: '/auditoria', icon: ClipboardList },
]

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  rh: 'RH',
  gestor: 'Gestor',
  consulta: 'Consulta',
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function Sidebar({ user }: { user: UserProfile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
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
        <div className="sidebar-logo">
          <Image src="/logotipos/BRS-GESTAO-FUNDO-ESCURO.png" alt="BRS" width={140} height={70} style={{ objectFit: 'contain' }} />
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-sub">Sistema RH</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
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

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user ? getInitials(user.name) : 'U'}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="user-name">{user?.name ?? 'Usuário'}</div>
              <div className="user-role-badge">{roleLabels[user?.role ?? ''] ?? ''}</div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-icon btn-sm"
              title="Sair"
              style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
