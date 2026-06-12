'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Edit2, Eye, Loader2, Plus, Users, X } from 'lucide-react'
import { getPromotoras, setPromotoraStatus } from './actions'

type PromotoraListItem = {
  id: string
  logo_url?: string | null
  razao_social: string
  nome_fantasia: string
  is_active: boolean
}

type FeedbackMessage = { type: 'success' | 'error'; text: string }

export default function PromotorasPage() {
  const [items, setItems] = useState<PromotoraListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<FeedbackMessage | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const res = await getPromotoras()
      if (res.success) setItems((res.items || []) as PromotoraListItem[])
      else setMessage({ type: 'error', text: res.error || 'Erro ao carregar promotoras.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao carregar promotoras.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleToggle(item: PromotoraListItem) {
    setBusyId(item.id)
    setMessage(null)
    try {
      const nextActive = !item.is_active
      const res = await setPromotoraStatus(item.id, nextActive)
      if (res.success) {
        setMessage({ type: 'success', text: nextActive ? 'Promotora reativada.' : 'Promotora inativada.' })
        await loadData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao alterar status.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao alterar status.' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brs-gray-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} />
            Promotoras
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Cadastro de promotoras para uso em outros subsistemas operacionais.
          </div>
        </div>

        <Link href="/promotoras/novo" className="btn btn-primary">
          <Plus size={16} />
          Incluir Promotora
        </Link>
      </div>

      {message && (
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
      )}

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Logotipo</th>
                <th>Razão Social</th>
                <th>Nome Fantasia</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <Users size={48} style={{ color: 'var(--brs-gray-300)', marginBottom: '1rem' }} />
                      <h3>Nenhuma promotora cadastrada</h3>
                      <p>Inicie a base operacional criando a primeira promotora.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--brs-gray-200)', background: '#fff', display: 'grid', placeItems: 'center' }}>
                        {item.logo_url ? (
                          <img src={item.logo_url} alt={item.razao_social} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Users size={18} color="var(--brs-gray-400)" />
                        )}
                      </div>
                    </td>
                    <td>{item.razao_social}</td>
                    <td>{item.nome_fantasia || '-'}</td>
                    <td>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-gray'}`}>
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Link href={`/promotoras/${item.id}?mode=view`} className="btn btn-ghost btn-sm">
                          <Eye size={16} />
                          Visualizar
                        </Link>
                        <Link href={`/promotoras/${item.id}`} className="btn btn-ghost btn-sm">
                          <Edit2 size={16} />
                          Editar
                        </Link>
                        <button
                          type="button"
                          className={`btn btn-sm ${item.is_active ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() => handleToggle(item)}
                          disabled={busyId === item.id}
                        >
                          {busyId === item.id ? <Loader2 size={16} className="spinner" /> : null}
                          {item.is_active ? 'Inativar' : 'Ativar'}
                        </button>
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
