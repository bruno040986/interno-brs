import { createClient } from '@/lib/supabase/server'
import {
  Users, UserX, Bus, AlertTriangle, TrendingUp, FileText, Clock, CheckCircle
} from 'lucide-react'

async function getDashboardStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { count: totalActive },
    { count: totalTerminated },
    { count: noVt },
    { count: vtOption },
    { count: vtRefusal },
    { count: warningsMonth },
    { count: suspensionsMonth },
  ] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'terminated'),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('vt_status', 'sem_informacao').eq('status', 'active'),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('vt_status', 'optante').eq('status', 'active'),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('vt_status', 'recusou').eq('status', 'active'),
    supabase.from('disciplinary_records').select('*', { count: 'exact', head: true })
      .neq('type', 'suspension')
      .gte('application_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
    supabase.from('disciplinary_records').select('*', { count: 'exact', head: true })
      .eq('type', 'suspension')
      .gte('application_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
  ])

  return { totalActive, totalTerminated, noVt, vtOption, vtRefusal, warningsMonth, suspensionsMonth }
}

async function getRecentDocs(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: vtDocs }, { data: discDocs }] = await Promise.all([
    supabase.from('vt_records')
      .select('id, type, generated_at, employee:employees(name, cpf)')
      .order('generated_at', { ascending: false })
      .limit(5),
    supabase.from('disciplinary_records')
      .select('id, type, application_date, employee:employees(name, cpf), reason:disciplinary_reasons(name)')
      .order('application_date', { ascending: false })
      .limit(5),
  ])
  return { vtDocs: vtDocs ?? [], discDocs: discDocs ?? [] }
}

function maskCpf(cpf: string) {
  if (!cpf) return ''
  const clean = cpf.replace(/\D/g, '')
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
}

function vtTypeLabel(type: string) {
  return type === 'option' ? 'Opção VT' : 'Recusa VT'
}

function discTypeLabel(type: string) {
  if (type === 'verbal_warning') return 'Advertência Verbal'
  if (type === 'written_warning') return 'Advertência Escrita'
  return 'Suspensão'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const stats = await getDashboardStats(supabase)
  const { vtDocs, discDocs } = await getRecentDocs(supabase)

  const now = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const statCards = [
    { label: 'Colaboradores Ativos', value: stats.totalActive ?? 0, iconClass: 'navy', Icon: Users },
    { label: 'Colaboradores Desligados', value: stats.totalTerminated ?? 0, iconClass: 'danger', Icon: UserX },
    { label: 'Sem Status de VT', value: stats.noVt ?? 0, iconClass: 'warning', Icon: Bus },
    { label: 'Optantes pelo VT', value: stats.vtOption ?? 0, iconClass: 'success', Icon: CheckCircle },
    { label: 'Recusaram VT', value: stats.vtRefusal ?? 0, iconClass: 'info', Icon: TrendingUp },
    { label: `Advertências em ${monthName}`, value: stats.warningsMonth ?? 0, iconClass: 'gold', Icon: AlertTriangle },
    { label: `Suspensões em ${monthName}`, value: stats.suspensionsMonth ?? 0, iconClass: 'danger', Icon: AlertTriangle },
  ]

  return (
    <div className="page-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
          Painel de Controle
        </h1>
        <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Visão geral do RH — BRS 2 Promotora Ltda
        </p>
      </div>

      <div className="stat-grid">
        {statCards.map(({ label, value, iconClass, Icon }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${iconClass}`}>
              <Icon size={20} />
            </div>
            <div className="stat-value">{value.toLocaleString('pt-BR')}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Últimos Termos VT */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Bus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Últimos Termos VT
            </h2>
          </div>
          {vtDocs.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <FileText />
              <p>Nenhum documento gerado ainda.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Tipo</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {vtDocs.map((doc: any) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{doc.employee?.name}</div>
                        <div className="cpf-masked" style={{ fontSize: '0.75rem' }}>{maskCpf(doc.employee?.cpf)}</div>
                      </td>
                      <td>
                        <span className={`badge ${doc.type === 'option' ? 'badge-success' : 'badge-warning'}`}>
                          {vtTypeLabel(doc.type)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--brs-gray-400)' }}>
                        <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {doc.generated_at ? new Date(doc.generated_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Últimas Medidas Disciplinares */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Últimas Medidas Disciplinares
            </h2>
          </div>
          {discDocs.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <FileText />
              <p>Nenhuma medida registrada ainda.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Tipo</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {discDocs.map((doc: any) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{doc.employee?.name}</div>
                        <div className="cpf-masked" style={{ fontSize: '0.75rem' }}>{maskCpf(doc.employee?.cpf)}</div>
                      </td>
                      <td>
                        <span className={`badge ${doc.type === 'suspension' ? 'badge-danger' : 'badge-warning'}`}>
                          {discTypeLabel(doc.type)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{doc.reason?.name ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
