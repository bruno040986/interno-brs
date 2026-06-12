'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Eye, Loader2, Plus, Scale, PencilLine, ShieldAlert } from 'lucide-react'
import { getTaxRegimes } from '../../../actions'
import {
  getActiveTaxRegimeVersion,
  getEnabledRateSummary,
  getTaxRegimeTotals,
  sortTaxRegimeVersions,
  type TaxRegimeRecord,
} from '@/lib/tax-regimes'

type FeedbackMessage = {
  type: 'success' | 'error'
  text: string
}

function formatBrazilianDate(value?: string | null) {
  if (!value) return '-'
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return String(value)
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
}

function SummaryRow({
  title,
  rates,
  total,
  extraBadges,
}: {
  title: string
  rates: string[]
  total?: string
  extraBadges?: string[]
}) {
  return (
    <div style={{ display: 'grid', gap: '0.35rem', alignContent: 'start' }}>
      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--brs-gray-500)', letterSpacing: '0.01em' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {rates.length ? (
          rates.map((rate) => (
            <span
              key={rate}
              className="badge badge-gray"
              style={{ background: '#F8FAFC', color: 'var(--brs-gray-700)', fontSize: '0.72rem', padding: '0.22rem 0.45rem' }}
            >
              {rate}
            </span>
          ))
        ) : (
          <span style={{ color: 'var(--brs-gray-400)', fontSize: '0.8rem' }}>Sem alíquotas habilitadas</span>
        )}
        {extraBadges?.map((badge) => (
          <span
            key={badge}
            className="badge badge-gray"
            style={{ background: '#EFF6FF', color: 'var(--brs-navy)', fontSize: '0.72rem', padding: '0.22rem 0.45rem' }}
          >
            {badge}
          </span>
        ))}
        {total ? (
          <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '0.22rem 0.45rem' }}>
            Total {total}%
          </span>
        ) : null}
      </div>
    </div>
  )
}

function TaxRegimeCompactCard({ item }: { item: TaxRegimeRecord }) {
  const activeVersion = getActiveTaxRegimeVersion(item)
  const totals = useMemo(() => (activeVersion ? getTaxRegimeTotals(activeVersion.config) : null), [activeVersion])

  const section1 = activeVersion
    ? getEnabledRateSummary([
        { key: 'simples_nacional', label: 'SN', field: activeVersion.config.section_1.simples_nacional },
        { key: 'iss', label: 'ISS', field: activeVersion.config.section_1.iss },
      ])
    : []

  const section2 = activeVersion
    ? getEnabledRateSummary([
        { key: 'pis', label: 'PIS', field: activeVersion.config.section_2.pis },
        { key: 'cofins', label: 'COFINS', field: activeVersion.config.section_2.cofins },
      ])
    : []

  const section3 = activeVersion
    ? getEnabledRateSummary([
        { key: 'ibs', label: 'IBS', field: activeVersion.config.section_3.ibs },
        { key: 'cbs', label: 'CBS', field: activeVersion.config.section_3.cbs },
      ])
    : []

  const section4 = activeVersion
    ? getEnabledRateSummary([
        { key: 'irpj', label: 'IRPJ', field: activeVersion.config.section_4.irpj },
        { key: 'csll', label: 'CSLL', field: activeVersion.config.section_4.csll },
        { key: 'pis', label: 'PIS', field: activeVersion.config.section_4.pis },
        { key: 'cofins', label: 'COFINS', field: activeVersion.config.section_4.cofins },
        { key: 'ibs', label: 'IBS', field: activeVersion.config.section_4.ibs },
        { key: 'cbs', label: 'CBS', field: activeVersion.config.section_4.cbs },
      ])
    : []

  return (
    <div className="card" style={{ padding: '0.85rem 0.95rem', border: '1px solid var(--brs-gray-100)', display: 'grid', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>{item.name}</div>
          <span className={`badge ${activeVersion ? 'badge-success' : 'badge-gray'}`}>{activeVersion ? 'Ativo' : 'Sem vigência ativa'}</span>
          <span className="badge badge-gray" style={{ background: '#F8FAFC', color: 'var(--brs-gray-600)' }}>
            Vigência inicial: {activeVersion ? formatBrazilianDate(activeVersion.effective_from) : '-'}
          </span>
        </div>

        <div style={{ display: 'inline-flex', gap: '0.45rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          <Link href={`/rh/parceiros/config/provedores/regimes-tributarios/${item.id}?mode=view`} className="btn btn-ghost btn-sm">
            <Eye size={16} />
            Visualizar
          </Link>
          <Link href={`/rh/parceiros/config/provedores/regimes-tributarios/${item.id}`} className="btn btn-ghost btn-sm">
            <PencilLine size={16} />
            Editar
          </Link>
        </div>
      </div>

      {activeVersion ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', alignItems: 'start' }}>
          <SummaryRow title="Alíquotas Fixas Sobre a Emissão de NFSe" rates={section1} />
          <SummaryRow
            title="Alíquotas Federais Fixas Sobre a Emissão de NFSe"
            rates={section2}
            total={totals?.section_2}
            extraBadges={[`Creditamento: ${activeVersion.config.section_2.accepts_credit ? 'Sim' : 'Não'}`]}
          />
          <SummaryRow title="Tributos com Creditamento Pleno" rates={section3} total={totals?.section_3} />
          <SummaryRow title="Impostos Passíveis de Retenção pelo Tomador do Serviço" rates={section4} total={totals?.section_4} />
        </div>
      ) : (
        <div style={{ padding: '0.95rem', borderRadius: 12, background: '#F8FAFC', border: '1px dashed var(--brs-gray-200)', color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>
          O regime está cadastrado, mas ainda não possui uma configuração de vigência ativa.
        </div>
      )}
    </div>
  )
}

export default function TaxRegimesPage() {
  const [items, setItems] = useState<TaxRegimeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<FeedbackMessage | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const res = await getTaxRegimes()
      if (res.success) {
        const nextItems = ((res.regimes || []) as TaxRegimeRecord[]).map((item) => ({
          ...item,
          versions: sortTaxRegimeVersions(item.versions || []),
        }))
        setItems(nextItems)
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao carregar regimes tributários.' })
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao carregar regimes tributários.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (cancelled) return
      await loadData()
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brs-gray-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={18} />
            Regimes Tributários
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Cadastro-base de legislação vigente com vigências históricas e configuração de alíquotas por regime.
          </div>
        </div>

        <Link href="/rh/parceiros/config/provedores/regimes-tributarios/novo" className="btn btn-primary">
          <Plus size={16} />
          Novo Regime Tributário
        </Link>
      </div>

      {message ? (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.875rem 1rem',
            borderRadius: 10,
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message.text}</span>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {loading ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Loader2 size={28} className="spinner" style={{ color: 'var(--brs-navy)' }} />
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="empty-state">
              <ShieldAlert size={48} style={{ color: 'var(--brs-gray-300)', marginBottom: '1rem' }} />
              <h3>Nenhum regime tributário cadastrado</h3>
              <p>Crie o primeiro regime para definir as vigências e alíquotas padrão do sistema.</p>
            </div>
          </div>
        ) : (
          items.map((item) => <TaxRegimeCompactCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
