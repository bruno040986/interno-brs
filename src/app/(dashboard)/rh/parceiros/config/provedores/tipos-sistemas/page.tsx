'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle, Cpu, Edit2, Loader2, Plus, Save, X } from 'lucide-react'
import { getSystemTypes, saveSystemType, setSystemTypeStatus } from '../../../actions'
import type { SystemTypeRecord } from '@/lib/system-types'

type FeedbackMessage = {
  type: 'success' | 'error'
  text: string
}

export default function SystemTypesPage() {
  const [items, setItems] = useState<SystemTypeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<FeedbackMessage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SystemTypeRecord | null>(null)
  const [name, setName] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const res = await getSystemTypes()
      if (res.success) {
        setItems((res.types || []) as SystemTypeRecord[])
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao carregar os tipos de sistemas.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao carregar os tipos de sistemas.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function openNewModal() {
    setEditingItem(null)
    setName('')
    setIsModalOpen(true)
  }

  function openEditModal(item: SystemTypeRecord) {
    setEditingItem(item)
    setName(String(item.name || ''))
    setIsModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const normalizedName = String(name || '').replace(/\s+/g, ' ').trim()
    if (!normalizedName) {
      setMessage({ type: 'error', text: 'Informe o nome do tipo de sistema.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const res = await saveSystemType({
        id: editingItem?.id,
        name: normalizedName,
        is_active: editingItem?.is_active ?? true,
      })

      if (res.success) {
        setMessage({ type: 'success', text: editingItem ? 'Tipo de sistema atualizado com sucesso.' : 'Tipo de sistema criado com sucesso.' })
        setIsModalOpen(false)
        setEditingItem(null)
        setName('')
        await loadData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao salvar o tipo de sistema.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao salvar o tipo de sistema.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(item: SystemTypeRecord) {
    if (!item.id) return
    setBusyId(item.id)
    setMessage(null)
    try {
      const nextActive = !item.is_active
      const res = await setSystemTypeStatus(item.id, nextActive)
      if (res.success) {
        setMessage({
          type: 'success',
          text: nextActive ? 'Tipo de sistema reativado.' : 'Tipo de sistema inativado.',
        })
        await loadData()
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao alterar o status.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao alterar o status.' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brs-gray-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} />
            Tipos de Sistemas
          </div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Cadastre tipos de sistemas para reutilização em outros subsistemas. O item pode ser ativado e inativado sem exclusão.
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={openNewModal}>
          <Plus size={16} />
          Novo Tipo de Sistema
        </button>
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
                <th>Tipo de Sistema</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>
                    <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <Cpu size={48} style={{ color: 'var(--brs-gray-300)', marginBottom: '1rem' }} />
                      <h3>Nenhum tipo de sistema cadastrado</h3>
                      <p>Crie o primeiro tipo para reutilizá-lo nos demais subsistemas.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{item.name}</div>
                    </td>
                    <td>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-gray'}`}>
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEditModal(item)}>
                          <Edit2 size={16} />
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${item.is_active ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() => handleToggleStatus(item)}
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

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(event) => event.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h3 className="modal-title">{editingItem ? 'Editar Tipo de Sistema' : 'Novo Tipo de Sistema'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)} aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ex.: ERP"
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
