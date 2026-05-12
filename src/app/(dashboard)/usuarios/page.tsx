'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCog, Plus, Mail, Shield, CheckCircle, X, Save, Loader2, Edit2 } from 'lucide-react'
import type { UserProfile, UserRole } from '@/types'

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> | null>(null)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true })
    
    if (!error && data) {
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
    
    // Observação: No Supabase, criação de usuários Auth deve ser feita via API/Admin Client 
    // ou o usuário deve se cadastrar. Aqui apenas atualizamos o perfil na tabela 'users'.
    // Para criar novo usuário (Auth), precisaríamos de um Service Role Client no backend.
    
    let error
    if (editingUser.id) {
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
      error = err
    } else {
      // Nota: Cadastro de novo usuário requer convite ou criação via Auth API
      // Por brevidade, este formulário atualizará apenas a tabela pública.
      // O ideal é usar o Supabase Auth Invite.
      alert('Para novos usuários, use a aba Authentication do Supabase e depois atualize o perfil aqui.')
      setSaving(false)
      return
    }
    
    if (!error) {
      setIsModalOpen(false)
      setEditingUser(null)
      fetchUsers()
    }
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
        <button className="btn btn-primary" onClick={() => alert('Crie o usuário no console do Supabase (Auth) primeiro.')}>
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
                <h3 className="modal-title">Editar Perfil de Usuário</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input 
                    type="text" 
                    className="form-control" 
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
                    value={editingUser?.email || ''}
                    disabled
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
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
