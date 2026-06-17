'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard } from 'lucide-react'

export default function InstituicoesFinanceirasSidebar() {
  const pathname = usePathname()
  const isActive = pathname.startsWith('/instituicoes-financeiras')

  return (
    <aside className="sidebar">
      <div style={{ height: '1.5rem' }} />

      <nav className="sidebar-nav">
        <div className="sidebar-nav-stack">
          <div className="sidebar-section-label">Instituições Financeiras</div>
          <Link
            href="/instituicoes-financeiras"
            className={`sidebar-link${isActive ? ' active' : ''}`}
          >
            <Building2 size={18} />
            Instituições Financeiras
          </Link>

          <div className="sidebar-section-label sidebar-section-label-spaced">Sistema</div>
          <Link href="/" className="sidebar-link">
            <LayoutDashboard size={18} />
            Voltar ao Workspace
          </Link>
        </div>
      </nav>
    </aside>
  )
}
