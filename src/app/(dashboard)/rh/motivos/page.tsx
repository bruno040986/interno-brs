'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  BookOpen, Plus, Edit2, X, Save, Loader2, 
  AlertCircle, ChevronRight, FileText
} from 'lucide-react'
import type { DisciplinaryReason } from '@/types'

export default function MotivosPage() {
  const [reasons, setReasons] = useState<DisciplinaryReason[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReason, setEditingReason] = useState<Partial<DisciplinaryReason> | null>(null)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  const fetchReasons = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('disciplinary_reasons')
      .select('*')
      .order('name', { ascending: true })
    
    if (!error && data) {
      setReasons(data as DisciplinaryReason[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchReasons()
  }, [fetchReasons])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingReason?.name) return
    
    setSaving(true)
    let error
    
    if (editingReason.id) {
      const { error: err } = await supabase
        .from('disciplinary_reasons')
        .update(editingReason)
        .eq('id', editingReason.id)
      error = err
    } else {
      const { error: err } = await supabase
        .from('disciplinary_reasons')
        .insert([editingReason])
      error = err
    }
    
    if (!error) {
      setIsModalOpen(false)
      setEditingReason(null)
      fetchReasons()
    }
    setSaving(false)
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Motivos de Medidas Disciplinares
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Padronize os motivos e textos para advertências e suspensões
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingReason({ name: '', default_gravity: 'leve', active: true }); setIsModalOpen(true); }}>
          <Plus size={16} />
          Novo Motivo
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Motivo</th>
                <th>Gravidade Padrão</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} /></td></tr>
              ) : reasons.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <BookOpen />
                      <h3>Nenhum motivo cadastrado</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                reasons.map((reason) => (
                  <tr key={reason.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{reason.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{reason.category}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        reason.default_gravity === 'gravissimo' ? 'badge-danger' : 
                        reason.default_gravity === 'grave' ? 'badge-warning' : 
                        reason.default_gravity === 'medio' ? 'badge-info' : 'badge-navy'
                      }`}>
                        {reason.default_gravity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${reason.active ? 'badge-success' : 'badge-gray'}`}>
                        {reason.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingReason(reason); setIsModalOpen(true); }}>
                        <Edit2 size={16} />
                      </button>
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
          <div className="modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <h3 className="modal-title">{editingReason?.id ? 'Editar Motivo' : 'Novo Motivo'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Nome do Motivo <span className="required">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      value={editingReason?.name || ''}
                      onChange={e => setEditingReason({ ...editingReason, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gravidade Padrão</label>
                    <select 
                      className="form-control" 
                      value={editingReason?.default_gravity || 'leve'}
                      onChange={e => setEditingReason({ ...editingReason, default_gravity: e.target.value as any })}
                    >
                      <option value="leve">Leve</option>
                      <option value="medio">Médio</option>
                      <option value="grave">Grave</option>
                      <option value="gravissimo">Gravíssimo</option>
                    </select>
                  </div>
                </div>

                <div className="section-divider">Templates de Texto (Sugestões)</div>
                
                <div className="form-group">
                  <label className="form-label">Histórico do Ocorrido (Template)</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Texto sugerido para o campo Histórico..."
                    value={editingReason?.template_history || ''}
                    onChange={e => setEditingReason({ ...editingReason, template_history: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gravidade e Impactos (Template)</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Texto sugerido para o campo Gravidade/Impactos..."
                    value={editingReason?.template_impact || ''}
                    onChange={e => setEditingReason({ ...editingReason, template_impact: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Recomendações (Template)</label>
                  <textarea 
                    className="form-control" 
                    placeholder="Texto sugerido para o campo Recomendações..."
                    value={editingReason?.template_recommendation || ''}
                    onChange={e => setEditingReason({ ...editingReason, template_recommendation: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Salvar Motivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
