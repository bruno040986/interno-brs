'use client'

import { useState } from 'react'
import { 
  Search, Bell, Grid, User, LogOut, Settings, 
  ShieldCheck, ExternalLink, HelpCircle, LayoutGrid,
  Megaphone, Briefcase, BarChart3, Bus, ShoppingCart, Key, Users
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { UserProfile } from '@/types'

interface HubHeaderProps {
  user: UserProfile
}

export default function HubHeader({ user }: HubHeaderProps) {
  const [showApps, setShowApps] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const systemApps = [
    { label: 'Home HUB', icon: LayoutGrid, href: '/', color: '#475569' },
    { label: 'Usuários', icon: User, href: '/usuarios', color: '#7c3aed' },
    { label: 'Configurações', icon: Settings, href: '#', color: '#475569' },
    { label: 'Comunicados', icon: Megaphone, href: '#', color: '#dc2626' },
    { label: 'Links', icon: ExternalLink, href: '/links', color: '#ea580c' },
    { label: 'Ajuda', icon: HelpCircle, href: '#', color: '#db2777' },
  ]

  const sectorApps = [
    { label: 'Adm', icon: Briefcase, href: '/?sector=adm', color: '#7c3aed' },
    { label: 'Financeiro', icon: BarChart3, href: '/?sector=fin', color: '#16a34a' },
    { label: 'RH', icon: Users, href: '/?sector=rh', color: '#2563eb' },
    { label: 'Operacional', icon: Bus, href: '/?sector=ops', color: '#ea580c' },
    { label: 'Marketing', icon: Megaphone, href: '/?sector=mkt', color: '#db2777' },
    { label: 'Comercial', icon: ShoppingCart, href: '/?sector=com', color: '#ca8a04' },
    { label: 'Acessos', icon: Key, href: '/?sector=acc', color: '#475569' },
  ]

  return (
    <header className="hub-header">
      <div className="hub-header-left">
        <Link href="/">
          <Image 
            src="/logotipos/BRS-GESTAO-FUNDO-CLARO.png" 
            alt="BRS Gestão" 
            width={120} 
            height={60} 
            priority
            style={{ objectFit: 'contain' }}
          />
        </Link>
      </div>

      <div className="hub-header-center">
        <div className="search-bar-hub">
          <Search size={18} />
          <input type="text" placeholder="Buscar na intranet..." />
        </div>
      </div>

      <div className="hub-header-right">
        <button className="icon-button">
          <Bell size={20} />
          <span className="notification-badge" />
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            className="icon-button"
            onClick={() => setShowApps(!showApps)}
          >
            <Grid size={20} />
          </button>

          {showApps && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '50px', 
                right: '0', 
                zIndex: 1000,
                width: '320px',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid var(--brs-gray-100)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Bloco Sistema */}
              <div style={{ padding: '1rem 1rem 0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brs-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Sistema
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {systemApps.map((app) => (
                    <Link 
                      key={app.label} 
                      href={app.href}
                      className="app-item"
                      onClick={() => setShowApps(false)}
                      style={{ padding: '0.75rem 0.25rem' }}
                    >
                      <div className="app-icon" style={{ color: app.color, marginBottom: '4px' }}>
                        <app.icon size={22} />
                      </div>
                      <span className="app-label" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{app.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Divisor */}
              <div style={{ height: '1px', background: 'var(--brs-gray-50)', margin: '0.5rem 1rem' }} />

              {/* Bloco Ferramentas */}
              <div style={{ padding: '0.5rem 1rem 1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brs-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Ferramentas
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {sectorApps.map((app) => (
                    <Link 
                      key={app.label} 
                      href={app.href}
                      className="app-item"
                      onClick={() => setShowApps(false)}
                      style={{ padding: '0.75rem 0.25rem' }}
                    >
                      <div className="app-icon" style={{ color: app.color, marginBottom: '4px' }}>
                        <app.icon size={22} />
                      </div>
                      <span className="app-label" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{app.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            className="user-profile-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user.name.charAt(0)}
            </div>
          </button>

          {showUserMenu && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '50px', 
                right: '0', 
                width: '200px',
                background: '#fff',
                border: '1px solid var(--brs-gray-100)',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                padding: '0.5rem',
                zIndex: 1000
              }}
            >
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--brs-gray-50)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{user.email}</div>
              </div>
              <button className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', color: 'var(--brs-danger)' }}>
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
