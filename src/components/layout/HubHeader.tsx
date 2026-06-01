'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, Grid, User, LogOut, Settings, X,
  ShieldCheck, ExternalLink, HelpCircle, LayoutGrid,
  Megaphone, Briefcase, Banknote, Monitor, UserCircle2, Key, Users
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ThemePreference, UserProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { getMyEffectivePermissions } from '@/lib/auth/actions'
import { hasAnyPermission, hasPermission, type EffectivePermission } from '@/lib/auth/permissions'
import { getPraiseNotifications, getPraiseUnreadCount, markPraiseNotificationsRead } from '@/app/(dashboard)/praises/actions'
import { setMyThemePreference } from '@/app/(dashboard)/theme/actions'
import { applyResolvedTheme, readStoredThemePreference, resolveTheme, storeThemePreference } from '@/components/theme/theme'

interface HubHeaderProps {
  user: UserProfile
}

export default function HubHeader({ user }: HubHeaderProps) {
  const router = useRouter()
  const [showApps, setShowApps] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [permissions, setPermissions] = useState<EffectivePermission[]>([])
  const [loading, setLoading] = useState(true)

  const [praiseUnread, setPraiseUnread] = useState<number>(0)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [notifItems, setNotifItems] = useState<any[]>([])
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null)
  const [themePref, setThemePref] = useState<ThemePreference>('light')

  useEffect(() => {
    async function loadPerms() {
      if (!user?.id) return
      try {
        const res = await getMyEffectivePermissions()
        if (res.success) {
          setPermissions(res.permissions || [])
        }
      } catch (err) {
        console.error('Erro ao carregar permissões no HubHeader:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPerms()
  }, [user?.id])

  useEffect(() => {
    const stored = readStoredThemePreference()
    const initial: ThemePreference = stored || user?.theme_preference || 'light'
    setThemePref(initial)
  }, [user?.theme_preference])

  async function handleThemeChange(next: ThemePreference) {
    setThemePref(next)
    storeThemePreference(next)
    applyResolvedTheme(resolveTheme(next))
    const res = await setMyThemePreference(next)
    if (!res?.success) {
      console.warn('Não foi possível salvar preferência de tema:', res?.error)
    }
  }

  async function refreshPraiseBadge() {
    if (!user?.id) return
    const res = await getPraiseUnreadCount()
    if (res.success) setPraiseUnread(res.count || 0)
  }

  async function loadNotifications() {
    setLoadingNotifs(true)
    const res = await getPraiseNotifications({ limit: 10 })
    if (res.success) setNotifItems((res.notifications || []) as any)
    setLoadingNotifs(false)
  }

  useEffect(() => {
    refreshPraiseBadge()
    const handler = () => refreshPraiseBadge()
    window.addEventListener('praise:refresh', handler)
    const interval = window.setInterval(() => refreshPraiseBadge(), 30000)
    const onFocus = () => refreshPraiseBadge()
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('praise:refresh', handler)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(interval)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    const channel = supabase
      .channel(`praise-notifs-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'praise_notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const newId = String((payload as any)?.new?.id || '')
          await refreshPraiseBadge()

          const listRes = await getPraiseNotifications({ limit: 10 })
          if (listRes.success) {
            const list = (listRes.notifications || []) as any[]
            setNotifItems(list)
            const current = list.find((n) => String(n.id) === newId) || list[0] || null
            const type = String(current?.type || (payload as any)?.new?.type || '')
            if (type === 'praise_reaction') {
              const actorName = String(current?.from_user?.name || 'Alguém')
              setToast({ id: newId || `t_${Date.now()}`, text: `${actorName} reagiu ao seu elogio!` })
            } else if (type === 'praise_received') {
              setToast({ id: newId || `t_${Date.now()}`, text: 'Você recebeu um elogio!' })
            }
          }

          window.setTimeout(() => setToast((prev) => (prev?.id === (newId || prev?.id || '') ? null : prev)), 4500)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const canView = (resourceId: string): boolean => {
    if (loading) return false
    return hasPermission(permissions, resourceId)
  }

  const configEntries = [
    { resource: 'sistema-config-email', href: '/rh/parceiros/config/provedores/email' },
    { resource: 'sistema-config-whatsapp', href: '/rh/parceiros/config/provedores/whatsapp' },
    { resource: 'sistema-config-assinatura', href: '/rh/parceiros/config/provedores/assinatura' },
    { resource: 'sistema-config-empresa', href: '/rh/parceiros/config/provedores/empresas' },
    { resource: 'sistema-config-google', href: '/rh/parceiros/config/provedores/google' },
    { resource: 'sistema-config-quarkrh', href: '/rh/parceiros/config/provedores/breve?api=QuarkRH' },
    { resource: 'sistema-config-contaazul', href: '/rh/parceiros/config/provedores/breve?api=ContaAzul' },
    { resource: 'sistema-config-arw', href: '/rh/parceiros/config/provedores/breve?api=ARW' },
    { resource: 'sistema-config-instituicoes', href: '/rh/parceiros/config/provedores/breve?api=Instituicoes' },
    { resource: 'sistema-config-crm', href: '/rh/parceiros/config/provedores/breve?api=CRM' },
  ]
  const firstConfigHref = configEntries.find((entry) => canView(entry.resource))?.href

  const systemApps = [
    { label: 'Home HUB', icon: LayoutGrid, href: '/', color: '#475569', id: 'home' },
    { label: 'Usuários', icon: User, href: '/usuarios', color: '#7c3aed', id: 'sistema-usuarios-root' },
    { label: 'Configurações', icon: Settings, href: '/rh/parceiros/config/provedores/email', color: '#475569', id: 'sistema-config-root' },
    { label: 'Comunicados', icon: Megaphone, href: '#', color: '#dc2626', id: 'sistema-comunicados' },
    { label: 'Links', icon: ExternalLink, href: '/links', color: '#ea580c', id: 'sistema-links' },
    { label: 'Ajuda', icon: HelpCircle, href: '#', color: '#db2777', id: 'sistema-ajuda' },
  ]

  const resolvedSystemApps = systemApps.map((app) =>
    app.id === 'sistema-config-root' ? { ...app, href: firstConfigHref || '#' } : app,
  )

  const sectorApps = [
    { label: 'Adm', icon: UserCircle2, href: '/?sector=adm', color: '#7c3aed', id: 'workspace-adm' },
    { label: 'Financeiro', icon: Banknote, href: '/?sector=fin', color: '#16a34a', id: 'workspace-fin' },
    { label: 'RH', icon: Users, href: '/?sector=rh', color: '#2563eb', id: 'workspace-rh' },
    { label: 'Operacional', icon: Monitor, href: '/?sector=ops', color: '#ea580c', id: 'workspace-ops' },
    { label: 'Marketing', icon: Megaphone, href: '/?sector=mkt', color: '#db2777', id: 'workspace-mkt' },
    { label: 'Comercial', icon: Briefcase, href: '/?sector=com', color: '#ca8a04', id: 'workspace-com' },
    { label: 'Acessos', icon: Key, href: '/?sector=acc', color: '#475569', id: 'workspace-acc' },
  ]

  const filteredSystemApps = resolvedSystemApps.filter(app => {
    if (app.id === 'home') return true
    if (app.id === 'sistema-usuarios-root') {
      return hasAnyPermission(permissions, [
        { resource: 'sistema-usuarios-root' },
        { resource: 'sistema-usuarios-cadastro' },
        { resource: 'sistema-usuarios-perfis' },
      ])
    }
    if (app.id === 'sistema-config-root') {
      return hasAnyPermission(
        permissions,
        configEntries.map((entry) => ({ resource: entry.resource })),
      )
    }
    return canView(app.id)
  })

  const filteredSectorApps = sectorApps.filter(app => {
    return canView(app.id)
  })

  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Erro ao sair:', err)
    } finally {
      setShowUserMenu(false)
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <header className="hub-header">
      <div className="hub-header-left">
        <Link href="/">
          <Image 
            src="/logotipos/BRS WORKSPACE FUNDO CLARO SEM FUNDO.png"
            alt="BRS Workspace"
            width={180}
            height={60} 
            priority
            style={{ objectFit: 'contain' }}
          />
        </Link>
      </div>

      <div className="hub-header-center">
        <div className="bia-bar-hub" title="Em breve a BIA vai estar aqui para te ajudar...">
          <Image className="bia-bar-hub-icon" src="/bia.png" alt="BIA" width={42} height={42} priority />
          <div className="bia-bar-hub-box">
            <span className="bia-bar-hub-label">Em breve a BIA vai estar aqui para te ajudar...</span>
          </div>
        </div>
      </div>

      <div className="hub-header-right">
        {toast && (
          <div
            style={{
              position: 'fixed',
              right: 18,
              bottom: 18,
              zIndex: 2000,
              background: 'var(--brs-surface)',
              border: '1px solid var(--brs-gray-100)',
              boxShadow: '0 10px 35px rgba(0,0,0,0.18)',
              borderRadius: 16,
              padding: '0.85rem 1rem',
              minWidth: 260,
              maxWidth: 360,
              fontWeight: 800,
              color: 'var(--brs-gray-800)',
              cursor: 'pointer',
            }}
            onClick={() => {
              setShowNotifications(true)
              loadNotifications()
            }}
            title="Abrir notificações"
          >
            {toast.text}
          </div>
        )}
        <div style={{ position: 'relative' }}>
        <button
          className="icon-button"
          onClick={async () => {
            const next = !showNotifications
            setShowNotifications(next)
            if (next) {
              await Promise.all([refreshPraiseBadge(), loadNotifications()])
            }
          }}
        >
          <Bell size={20} />
          {praiseUnread > 0 && <span className="notification-badge">{Math.min(99, praiseUnread)}</span>}
        </button>

        {showNotifications && (
          <div
            style={{
              position: 'absolute',
              top: '50px',
              right: 0,
              zIndex: 1000,
              width: '320px',
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              border: '1px solid var(--brs-gray-100)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.9rem 1rem', fontWeight: 900, color: 'var(--brs-gray-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Notificações
              <button className="icon-button" style={{ width: 30, height: 30 }} onClick={() => setShowNotifications(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ borderTop: '1px solid var(--brs-gray-50)' }} />
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {loadingNotifs ? (
                <div style={{ padding: '1rem', color: 'var(--brs-gray-400)', fontSize: '0.8125rem', textAlign: 'center' }}>Carregando…</div>
              ) : notifItems.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--brs-gray-400)', fontSize: '0.8125rem', textAlign: 'center' }}>Nenhuma notificação.</div>
              ) : (
                notifItems.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={async () => {
                      await markPraiseNotificationsRead({ praise_id: n.praise_id })
                      window.dispatchEvent(new Event('praise:refresh'))
                      setShowNotifications(false)
                      const type = String(n.type || 'praise_received')
                      if (type === 'praise_reaction') {
                        router.push(`/?praiseTab=feed&praiseId=${encodeURIComponent(String(n.praise_id))}`)
                      } else {
                        router.push('/?praiseTab=received')
                      }
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.85rem 1rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'grid',
                      gap: '0.25rem',
                    }}
                  >
                    {String(n.type || 'praise_received') === 'praise_reaction' ? (
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brs-gray-800)' }}>
                        {`${String(n?.from_user?.name || 'Alguém')} reagiu ao seu elogio ${
                          String(n?.praise?.from_user_id || '') === String(user?.id || '') ? 'enviado' : 'recebido'
                        }!`}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brs-gray-800)' }}>Você recebeu um elogio!</div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>
                      {new Date(String(n.created_at || '')).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        </div>

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
                background: 'var(--brs-surface)',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid var(--brs-gray-100)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Bloco Sistema */}
              {filteredSystemApps.length > 0 && (
                <div style={{ padding: '1rem 1rem 0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brs-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Sistema
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    {filteredSystemApps.map((app) => (
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
              )}

              {/* Divisor */}
              {filteredSystemApps.length > 0 && filteredSectorApps.length > 0 && (
                <div style={{ height: '1px', background: 'var(--brs-gray-50)', margin: '0.5rem 1rem' }} />
              )}

              {/* Bloco Ferramentas */}
              {filteredSectorApps.length > 0 && (
                <div style={{ padding: '0.5rem 1rem 1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brs-gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Ferramentas
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    {filteredSectorApps.map((app) => (
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
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button 
            className="user-profile-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar" style={{ overflow: 'hidden' }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.name.charAt(0)
              )}
            </div>
          </button>

          {showUserMenu && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '55px', 
                right: '0', 
                width: '320px',
                background: 'var(--brs-surface)',
                borderRadius: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                padding: '1.5rem',
                zIndex: 1000,
                textAlign: 'center',
                border: '1px solid var(--brs-gray-100)'
              }}
            >
              <div style={{ marginBottom: '1rem', color: 'var(--brs-gray-600)', fontSize: '0.875rem' }}>
                {user.email}
              </div>
              
              <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1rem', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--brs-gray-100)' }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brs-navy)', color: '#fff', fontSize: '2rem', fontWeight: 600 }}>
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 500, color: 'var(--brs-navy)', marginBottom: '1.5rem' }}>
                Olá, {user.name.split(' ')[0]}!
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brs-gray-400)', marginBottom: '0.35rem' }}>
                    Tema
                  </div>
                  <select
                    className="form-control"
                    value={themePref}
                    onChange={(e) => handleThemeChange(e.target.value as ThemePreference)}
                    style={{ width: '100%', borderRadius: '999px' }}
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="system">Navegador (Sistema)</option>
                  </select>
                </div>
                {canView('sistema-usuarios-root') && (
                  <Link 
                    href="/usuarios" 
                    className="btn btn-outline" 
                    style={{ borderRadius: '100px', padding: '0.6rem', fontSize: '0.875rem', fontWeight: 600, justifyContent: 'center' }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    Gerenciar sua conta
                  </Link>
                )}
                
                <button 
                  className="btn btn-ghost" 
                  style={{ borderRadius: '100px', padding: '0.6rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--brs-danger)', justifyContent: 'center', marginTop: '1rem' }}
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>
                <span>Privacidade</span>
                <span>•</span>
                <span>Termos</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
