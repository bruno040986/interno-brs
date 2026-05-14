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
  { label: 'Usuários', href: '/usuarios', icon: UserCog },
  { label: 'Auditoria', href: '/rh/auditoria', icon: ClipboardList },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/rh') return pathname === '/rh'
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
        <div style={{ height: '1.5rem' }} /> {/* Pequeno respiro no topo */}

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

      </aside>
    </>
  )
}
