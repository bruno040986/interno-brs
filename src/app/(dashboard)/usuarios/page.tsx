'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Mail, X, Save, Loader2, Edit2, AlertCircle } from 'lucide-react'
import type { UserProfile, UserRole } from '@/types'
import { inviteUser } from './actions'

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true })
    
    if (fetchError) {
      setError('Falha ao carregar usuários. Verifique as permissões no Supabase.')
    } else if (data) {
      setUsers(data as UserProfile[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser?.email || !editingUser?.name || !editingUser?.role) return
    
    setSaving(true)
    setError(null)
    
    if (editingUser.id) {
      // ATUALIZAÇÃO DE PERFIL EXISTENTE
      const { error: err } = await supabase
        .from('users')
        .update({
          name: editingUser.name,
          role: editingUser.role,
          department: editingUser.department,
          active: editingUser.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)
      
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
    } else {
      // NOVO CONVITE DE USUÁRIO
      const result = await inviteUser({
        email: editingUser.email,
        name: editingUser.name,
        role: editingUser.role,
        department: editingUser.department
      })

      if (!result.success) {
        setError(result.error || 'Erro ao convidar usuário')
        setSaving(false)
        return
      }
    }
    
    setIsModalOpen(false)
    setEditingUser(null)
    fetchUsers()
    setSaving(false)
  }

  const roleBadge = (role: string) => {
    switch(role) {
      case 'admin': return 'badge-danger'
      case 'rh': return 'badge-success'
      case 'gestor': return 'badge-info'
      default: return 'badge-gray'
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Gestão de Usuários
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Controle quem pode acessar e operar o sistema
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingUser({ role: 'consulta' as UserRole, active: true }); setIsModalOpen(true); setError(null); }}>
          <Plus size={16} />
          Convidar Usuário
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome / E-mail</th>
                <th>Perfil / Setor</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} /></td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Mail size={12} /> {user.email}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${roleBadge(user.role)}`}>{user.role}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)', marginTop: '0.25rem' }}>{user.department || '-'}</div>
                    </td>
                    <td>
                      <span className={`badge ${user.active ? 'badge-success' : 'badge-gray'}`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingUser(user); setIsModalOpen(true); }}>
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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <h3 className="modal-title">{editingUser?.id ? 'Editar Perfil' : 'Convidar Novo Usuário'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: João Silva"
                    value={editingUser?.name || ''}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="email@brspromotora.com.br"
                    value={editingUser?.email || ''}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    disabled={!!editingUser?.id}
                    required
                  />
                </div>
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Perfil de Acesso</label>
                    <select 
                      className="form-control"
                      value={editingUser?.role || 'consulta'}
                      onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    >
                      <option value="admin">Administrador (Total)</option>
                      <option value="rh">Recursos Humanos</option>
                      <option value="gestor">Gestor de Equipe</option>
                      <option value="consulta">Apenas Consulta</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Setor (para Gestores)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingUser?.department || ''}
                      onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={editingUser?.active || false}
                      onChange={e => setEditingUser({ ...editingUser, active: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.875rem' }}>Usuário Ativo</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  {editingUser?.id ? 'Salvar Alterações' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
