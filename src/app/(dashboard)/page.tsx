'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Users, Bus, AlertTriangle, TrendingUp, FileText, 
  Clock, CheckCircle, Calendar, MessageSquare, 
  Megaphone, ChevronRight, X, ExternalLink,
  ShieldCheck, Briefcase, BarChart3, ShoppingCart, Key, Loader2
} from 'lucide-react'
import { getLinksBySector } from './links/actions'

export default function HubPage() {
  const searchParams = useSearchParams()
  const [activeSector, setActiveSector] = useState<string | null>(null)
  const [agendaTab, setAgendaTab] = useState<'user' | 'company'>('user')
  const [sectorLinks, setSectorLinks] = useState<any[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)

  useEffect(() => {
    const sector = searchParams.get('sector')
    if (sector) {
      handleSelectSector(sector)
    }
  }, [searchParams])

  const handleSelectSector = async (sectorId: string) => {
    setActiveSector(sectorId)
    setLoadingLinks(true)
    const result = await getLinksBySector(sectorId)
    if (result.success) {
      setSectorLinks(result.data || [])
    }
    setLoadingLinks(false)
  }

  const sectors = [
    { 
      id: 'adm', 
      name: 'Administrativo', 
      icon: Briefcase, 
      color: 'adm',
      links: [
        { label: 'Políticas Internas', href: '#' },
        { label: 'Documentos Oficiais', href: '#' },
        { label: 'Gestão de Contratos', href: '#' },
      ]
    },
    { 
      id: 'fin', 
      name: 'Financeiro', 
      icon: BarChart3, 
      color: 'fin',
      links: [
        { label: 'Reembolsos', href: '#' },
        { label: 'Notas Fiscais', href: '#' },
        { label: 'Relatórios de Custos', href: '#' },
      ]
    },
    { 
      id: 'rh', 
      name: 'RH', 
      icon: Users, 
      color: 'rh',
      links: [
        { label: 'Painel de Controle RH', href: '/rh' },
        { label: 'Vale-Transporte', href: '/vale-transporte' },
        { label: 'Medidas Disciplinares', href: '/medidas-disciplinares' },
        { label: 'Colaboradores', href: '/colaboradores' },
        { label: 'QuarkRH', href: 'https://quarkrh.com.br', external: true },
      ]
    },
    { 
      id: 'ops', 
      name: 'Operacional', 
      icon: Bus, 
      color: 'ops',
      links: [
        { label: 'Controle de Frota', href: '#' },
        { label: 'Logística', href: '#' },
        { label: 'Manutenção', href: '#' },
      ]
    },
    { 
      id: 'mkt', 
      name: 'Marketing', 
      icon: Megaphone, 
      color: 'mkt',
      links: [
        { label: 'Brandbook', href: '#' },
        { label: 'Solicitar Artes', href: '#' },
        { label: 'Redes Sociais', href: '#' },
      ]
    },
    { 
      id: 'com', 
      name: 'Comercial', 
      icon: ShoppingCart, 
      color: 'com',
      links: [
        { label: 'CRM', href: '#' },
        { label: 'Metas de Vendas', href: '#' },
        { label: 'Pipeline', href: '#' },
      ]
    },
    { 
      id: 'acc', 
      name: 'Acessos', 
      icon: Key, 
      color: 'acc',
      links: [
        { label: 'Cofre de Senhas', href: '#' },
        { label: 'Solicitar Acesso', href: '#' },
      ]
    }
  ]

  const birthdays = [
    { name: 'Mariana Silva', dept: 'Marketing', day: 'Hoje' },
    { name: 'Carlos Eduardo', dept: 'TI', day: '15 de Maio' },
    { name: 'Beatriz Costa', dept: 'Financeiro', day: '22 de Maio' },
  ]

  const announcements = [
    { title: 'Novo Benefício Saúde', date: 'Há 2 horas', priority: 'high' },
    { title: 'Reunião Geral Trimestral', date: 'Ontem', priority: 'medium' },
    { title: 'Manutenção no Ar-condicionado', date: '12 Mai', priority: 'low' },
  ]

  return (
    <div className="hub-container">
      <div className="hub-layout">
        {/* Coluna Principal */}
        <div className="hub-main">
          
          {/* Saudação e Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brs-gray-800)', margin: 0 }}>
                Bom dia, Usuário!
              </h1>
              <p style={{ color: 'var(--brs-gray-400)', fontSize: '1rem', marginTop: '0.5rem' }}>
                Hoje é dia 13 de Maio. Veja o que temos para hoje.
              </p>
            </div>
          </div>

        <div className="hub-banner">
          <div style={{ maxWidth: '500px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Campanha Agasalho 2026</h2>
            <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>Participe da nossa campanha anual de doação. Os pontos de coleta estão em todas as unidades.</p>
            <button className="btn btn-primary" style={{ background: '#fff', color: 'var(--brs-navy)' }}>Saiba Mais</button>
          </div>
          {/* Aqui entraria a galeria de imagens futuramente */}
        </div>

        {/* Grid de Setores ou Detalhe do Setor */}
        {!activeSector ? (
          <div className="hub-sections-grid">
            {sectors.map((sector) => (
              <div 
                key={sector.id} 
                className="sector-card"
                onClick={() => handleSelectSector(sector.id)}
              >
                <div className={`sector-icon ${sector.color}`}>
                  <sector.icon size={24} />
                </div>
                <h3 className="sector-title">{sector.name}</h3>
                <div className="sector-action">
                  Acessar Portal <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ animation: 'slideIn 0.3s ease' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={`sector-icon ${sectors.find(s => s.id === activeSector)?.color}`} style={{ marginBottom: 0 }}>
                  {sectors.find(s => s.id === activeSector)?.icon && (
                    <div style={{ color: 'inherit' }}>
                      {/* @ts-ignore */}
                      {(() => { const Icon = sectors.find(s => s.id === activeSector)!.icon; return <Icon size={24} /> })()}
                    </div>
                  )}
                </div>
                <h2 className="card-title" style={{ margin: 0 }}>Portal {sectors.find(s => s.id === activeSector)?.name}</h2>
              </div>
              <button 
                className="icon-button" 
                onClick={() => setActiveSector(null)}
                style={{ background: 'var(--brs-gray-50)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="card-body">
              {loadingLinks ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader2 className="spinner" />
                  <p style={{ marginTop: '0.5rem', color: 'var(--brs-gray-400)', fontSize: '0.875rem' }}>Buscando ferramentas...</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {/* Links Fixos (Base) */}
                  {sectors.find(s => s.id === activeSector)?.links.map((link) => (
                    <a 
                      key={link.label} 
                      href={link.href} 
                      target={link.external ? '_blank' : '_self'}
                      className="sector-card"
                      style={{ padding: '1.25rem', textAlign: 'center', textDecoration: 'none' }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--brs-navy)' }}>{link.label}</div>
                      {link.external && <div style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Externo <ExternalLink size={10} /></div>}
                    </a>
                  ))}

                  {/* Links Dinâmicos do Banco */}
                  {sectorLinks.map((link) => (
                    <a 
                      key={link.id} 
                      href={link.url} 
                      target={link.is_external ? '_blank' : '_self'}
                      className="sector-card"
                      style={{ padding: '1.25rem', textAlign: 'center', textDecoration: 'none', borderColor: 'var(--brs-gold)' }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--brs-navy)' }}>{link.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--brs-gold)', fontWeight: 600 }}>Ferramenta Setorial</div>
                    </a>
                  ))}

                  {sectorLinks.length === 0 && !sectors.find(s => s.id === activeSector)?.links.length && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--brs-gray-400)' }}>
                      Nenhuma ferramenta cadastrada para este setor.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Coluna Lateral (Widgets) */}
      <div className="hub-sidebar">
        
        {/* Widget de Aniversariantes (Subiu para o topo conforme solicitado) */}
        <div className="widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Calendar size={18} style={{ color: 'var(--brs-gold)' }} />
              Aniversariantes do Mês
            </h3>
          </div>
          <div className="widget-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {birthdays.map((person) => (
                <div key={person.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="user-avatar" style={{ width: '36px', height: '36px' }}>{person.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{person.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{person.dept} • {person.day}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget de Agenda */}
        <div className="widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Clock size={18} style={{ color: 'var(--brs-navy)' }} />
              Sua Agenda
            </h3>
          </div>
          <div className="tab-nav">
            <div 
              className={`tab-button ${agendaTab === 'user' ? 'active' : ''}`}
              onClick={() => setAgendaTab('user')}
            >
              Minha
            </div>
            <div 
              className={`tab-button ${agendaTab === 'company' ? 'active' : ''}`}
              onClick={() => setAgendaTab('company')}
            >
              Empresa
            </div>
          </div>
          <div className="widget-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ borderLeft: '3px solid #2563eb', paddingLeft: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>10:00 - Hoje</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Alinhamento Q3</div>
                <button className="btn btn-sm btn-primary" style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Entrar no Meet</button>
              </div>
              <div style={{ borderLeft: '3px solid var(--brs-gray-200)', paddingLeft: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>14:30 - Hoje</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brs-gray-600)' }}>Revisão de Metas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Widget de Google Chat */}
        <div className="widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <MessageSquare size={18} style={{ color: '#16a34a' }} />
              Google Chat
            </h3>
          </div>
          <div className="widget-content" style={{ textAlign: 'center', padding: '2rem 1.25rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--brs-gray-400)', marginBottom: '1rem' }}>Mantenha-se conectado com a equipe em tempo real.</p>
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }}>Abrir Chat</button>
          </div>
        </div>

        {/* Widget de Comunicados */}
        <div className="widget-card">
          <div className="widget-header">
            <h3 className="widget-title">
              <Megaphone size={18} style={{ color: 'var(--brs-danger)' }} />
              Comunicados
            </h3>
          </div>
          <div className="widget-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.map((news) => (
                <div key={news.title} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--brs-gray-50)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brs-gray-800)' }}>{news.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)', marginTop: '0.25rem' }}>{news.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      </div>
    </div>
  )
}
