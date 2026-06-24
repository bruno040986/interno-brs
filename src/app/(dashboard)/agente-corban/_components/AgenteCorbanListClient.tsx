'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Edit2, Eye, Plus, RefreshCw, Search, UserRound } from 'lucide-react'
import {
  AGENTE_CORBAN_STATUS_LABELS,
  formatAgenteCorbanPersonTypeLabel,
  formatAgenteCorbanSearchText,
  formatAgenteCorbanStatusLabel,
  formatCpfOrCnpjDisplay,
  normalizeText,
  normalizeStatus,
  type AgenteCorbanStatus,
} from '@/lib/agente-corban'

type AgenteCorbanListItem = Record<string, any> & {
  id: string
  name?: string | null
  cpf_cnpj?: string | null
  person_type?: string | null
  status?: AgenteCorbanStatus | string | null
  arw_code?: string | null
  filial?: string | null
  nivel_acesso?: string | null
  tipo_agente?: string | null
  regra_fisico?: string | null
  search_text?: string
}

type CompanyProfileLookup = {
  id: string
  nickname: string
  cnpj?: string | null
  is_active?: boolean
  company_data?: Record<string, any> | null
}

type AgenteCorbanListClientProps = {
  initialItems: AgenteCorbanListItem[]
  companyProfiles: CompanyProfileLookup[]
}

const PERSON_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'PF', label: 'Pessoa Física' },
  { value: 'PJ', label: 'Pessoa Jurídica' },
] as const

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  ...(Object.entries(AGENTE_CORBAN_STATUS_LABELS).map(([value, label]) => ({ value, label })) as Array<{ value: AgenteCorbanStatus; label: string }>),
] as const

function formatFilialLabel(row: AgenteCorbanListItem, companyProfiles: CompanyProfileLookup[]) {
  if (!row.filial) return 'Sem filial'
  const company = companyProfiles.find((item) => item.id === row.filial)
  if (!company) return row.filial
  const cnpj = formatCpfOrCnpjDisplay(company.cnpj || '')
  return [company.nickname, cnpj].filter(Boolean).join(' · ')
}

export default function AgenteCorbanListClient({ initialItems, companyProfiles }: AgenteCorbanListClientProps) {
  const [items, setItems] = useState<AgenteCorbanListItem[]>(initialItems || [])
  const [query, setQuery] = useState('')
  const [personType, setPersonType] = useState<'all' | 'PF' | 'PJ'>('all')
  const [status, setStatus] = useState<'all' | AgenteCorbanStatus>('all')
  const [loading, setLoading] = useState(false)

  const filteredItems = useMemo(() => {
    const search = normalizeText(query).toLowerCase()
    return items.filter((item) => {
      const typeMatch = personType === 'all' || String(item.person_type || '').toUpperCase() === personType
      const normalizedStatus = normalizeStatus(item.status)
      const statusMatch = status === 'all' || normalizedStatus === status
      const searchText = String(item.search_text || formatAgenteCorbanSearchText(item)).toLowerCase()
      const queryMatch = !search || searchText.includes(search)
      return typeMatch && statusMatch && queryMatch
    })
  }, [items, personType, query, status])

  const counts = useMemo(() => {
    const total = items.length
    const active = items.filter((item) => normalizeStatus(item.status) !== 'inativo').length
    return { total, active }
  }, [items])

  async function reload() {
    setLoading(true)
    try {
      const { getAgenteCorbanList } = await import('../actions')
      const result = await getAgenteCorbanList()
      if (result.success) {
        setItems((result.items || []) as AgenteCorbanListItem[])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 800, color: 'var(--brs-gray-900)' }}>
            <UserRound size={18} />
            Agente Corban
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Cadastro operacional do parceiro mestre com editor tabulado e catálogos auxiliares.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={reload} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinner' : undefined} />
            Recarregar
          </button>
          <Link href="/agente-corban/novo" className="btn btn-primary">
            <Plus size={16} />
            Novo Agente
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 6' }}>
            <label className="form-label">Buscar</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--brs-gray-400)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: '2.2rem' }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome, CPF/CNPJ, ARW, filial, acesso..."
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 3' }}>
            <label className="form-label">Tipo</label>
            <select className="form-control" value={personType} onChange={(e) => setPersonType(e.target.value as 'all' | 'PF' | 'PJ')}>
              {PERSON_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 3' }}>
            <label className="form-label">Status</label>
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value as 'all' | AgenteCorbanStatus)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: '0.9rem 1rem', minWidth: 180 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--brs-gray-500)' }}>Total</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{counts.total}</div>
        </div>
        <div className="card" style={{ padding: '0.9rem 1rem', minWidth: 180 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--brs-gray-500)' }}>Ativos</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{counts.active}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parceiro</th>
                <th>CPF/CNPJ</th>
                <th>Tipo</th>
                <th>ARW</th>
                <th>Filial</th>
                <th>Acesso</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--brs-gray-500)' }}>
                    Nenhum parceiro encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--brs-gray-900)' }}>{item.name || 'Sem nome'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--brs-gray-500)' }}>
                        {formatAgenteCorbanSearchText(item).split(' ').slice(0, 3).join(' ')}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{formatCpfOrCnpjDisplay(item.cpf_cnpj || '') || '—'}</td>
                    <td>{formatAgenteCorbanPersonTypeLabel(item.person_type || 'PJ')}</td>
                    <td>{item.arw_code || '—'}</td>
                    <td>{formatFilialLabel(item, companyProfiles)}</td>
                    <td>
                      <div style={{ display: 'grid', gap: '0.2rem' }}>
                        <span>{item.nivel_acesso || '—'}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--brs-gray-500)' }}>{item.tipo_agente || '—'}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--brs-gray-500)' }}>{item.regra_fisico || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${normalizeStatus(item.status) === 'ativo' ? 'badge-success' : 'badge-gray'}`}>
                        {formatAgenteCorbanStatusLabel(item.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Link href={`/agente-corban/${item.id}?mode=view`} className="btn btn-ghost btn-sm">
                          <Eye size={16} />
                          Abrir
                        </Link>
                        <Link href={`/agente-corban/${item.id}`} className="btn btn-ghost btn-sm">
                          <Edit2 size={16} />
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
