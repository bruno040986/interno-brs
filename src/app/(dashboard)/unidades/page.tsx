'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, Plus, MapPin, Hash, CheckCircle, 
  Trash2, Edit2, X, Save, Loader2 
} from 'lucide-react'
import type { CompanyUnit } from '@/types'

export default function UnidadesPage() {
  const [units, setUnits] = useState<CompanyUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Partial<CompanyUnit> | null>(null)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  const fetchUnits = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('company_units')
      .select('*')
      .order('name', { ascending: true })
    
    if (!error && data) {
      setUnits(data as CompanyUnit[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUnit?.name) return
    
    setSaving(true)
    let error
    
    if (editingUnit.id) {
      const { error: err } = await supabase
        .from('company_units')
        .update(editingUnit)
        .eq('id', editingUnit.id)
      error = err
    } else {
      const { error: err } = await supabase
        .from('company_units')
        .insert([editingUnit])
      error = err
    }
    
    if (!error) {
      setIsModalOpen(false)
      setEditingUnit(null)
      fetchUnits()
    }
    setSaving(false)
  }

  function openCreateModal() {
    setEditingUnit({ name: '', active: true })
    setIsModalOpen(true)
  }

  function openEditModal(unit: CompanyUnit) {
    setEditingUnit(unit)
    setIsModalOpen(true)
  }

  async function toggleStatus(unit: CompanyUnit) {
    const { error } = await supabase
      .from('company_units')
      .update({ active: !unit.active })
      .eq('id', unit.id)
    
    if (!error) fetchUnits()
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Unidades da Empresa
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Gerencie os endereços das sedes e unidades para documentos
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          Nova Unidade
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Unidade</th>
                <th>Endereço</th>
                <th>CNPJ</th>
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
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <Building2 />
                      <h3>Nenhuma unidade cadastrada</h3>
                      <p>Cadastre a primeira unidade para começar a gerar documentos.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{unit.name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        {unit.address}, {unit.number} {unit.complement}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>
                        {unit.neighborhood} - {unit.city}/{unit.state}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>{unit.cnpj || '-'}</td>
                    <td>
                      <button 
                        onClick={() => toggleStatus(unit)}
                        className={`badge ${unit.active ? 'badge-success' : 'badge-gray'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        {unit.active ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditModal(unit)}>
                          <Edit2 size={16} />
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <h3 className="modal-title">{editingUnit?.id ? 'Editar Unidade' : 'Nova Unidade'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Unidade <span className="required">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: BRS Promotora" 
                    required
                    value={editingUnit?.name || ''}
                    onChange={e => setEditingUnit({ ...editingUnit, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="00.000.000/0001-00" 
                    value={editingUnit?.cnpj || ''}
                    onChange={e => setEditingUnit({ ...editingUnit, cnpj: e.target.value })}
                  />
                </div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Endereço</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUnit?.address || ''}
                      onChange={e => setEditingUnit({ ...editingUnit, address: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUnit?.number || ''}
                      onChange={e => setEditingUnit({ ...editingUnit, number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Complemento</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUnit?.complement || ''}
                      onChange={e => setEditingUnit({ ...editingUnit, complement: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bairro</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUnit?.neighborhood || ''}
                      onChange={e => setEditingUnit({ ...editingUnit, neighborhood: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Cidade</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUnit?.city || ''}
                      onChange={e => setEditingUnit({ ...editingUnit, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="UF"
                      maxLength={2}
                      value={editingUnit?.state || ''}
                      onChange={e => setEditingUnit({ ...editingUnit, state: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CEP</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUnit?.zip_code || ''}
                      onChange={e => setEditingUnit({ ...editingUnit, zip_code: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
