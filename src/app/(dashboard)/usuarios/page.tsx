'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Mail, X, Save, Loader2, Edit2, AlertCircle, 
  User, Shield, Clock, ShieldCheck, UserPlus, Key, Trash2, AlertTriangle 
} from 'lucide-react'
import type { UserProfile } from '@/types'
import { saveUserDirectly, saveProfile, getAccessData, getProfilePermissions, getUserPermissions } from './actions'

// Definição de horários padrão
const DEFAULT_SCHEDULES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, idx) => ({
  day_of_week: idx,
  enabled: idx < 5,
  start_time_1: '08:00',
  end_time_1: '12:00',
  start_time_2: '13:30',
  end_time_2: '18:00'
}))

// Definição dos módulos do sistema para a matriz
const SYSTEM_MODULES = [
  { id: 'colaboradores', name: 'Colaboradores (RH)' },
  { id: 'vale-transporte', name: 'Vale-Transporte' },
  { id: 'medidas-disciplinares', name: 'Medidas Disciplinares' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'operacional', name: 'Operacional' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'comercial', name: 'Comercial' },
  { id: 'acessos', name: 'Acessos (Cofre)' },
  { id: 'usuarios', name: 'Gestão de Usuários' },
  { id: 'comunicados', name: 'Comunicados / Banner' },
]

export default function UsuariosPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'profiles'>('users')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  
  // Estados para edição de Usuário
  const [editingUser, setEditingUser] = useState<any | null>(null)
  
  // Estados para edição de Perfil
  const [editingProfile, setEditingProfile] = useState<any>({
    name: '',
    permissions: SYSTEM_MODULES.map(m => ({
      resource_name: m.id,
      can_view: false,
      can_include: false,
      can_edit: false,
      can_delete: false,
      can_activate_inactivate: false
    })),
    schedules: DEFAULT_SCHEDULES
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const result = await getAccessData()
    if (result.success) {
      setProfiles(result.profiles)
      setUsers(result.users)
    } else {
      console.error('Erro ao buscar dados:', result.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- LÓGICA DE PERFIS ---
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const result = await saveProfile({
        id: editingProfile.id,
        name: editingProfile.name,
        permissions: editingProfile.permissions,
        schedules: editingProfile.schedules
      });

      if (!result.success) throw new Error(result.error);

      setIsProfileModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (idx: number, field: string) => {
    const newPerms = [...editingProfile.permissions]
    newPerms[idx][field] = !newPerms[idx][field]
    setEditingProfile({ ...editingProfile, permissions: newPerms })
  }

  const toggleAllColumn = (field: string, target: 'profile' | 'user') => {
    if (target === 'profile') {
      const allSelected = editingProfile.permissions.every((p: any) => p[field]);
      const newPerms = editingProfile.permissions.map((p: any) => ({ ...p, [field]: !allSelected }));
      setEditingProfile({ ...editingProfile, permissions: newPerms });
    } else {
      const allSelected = SYSTEM_MODULES.every(m => {
        const p = editingUser?.permissions?.find((p: any) => p.resource_name === m.id);
        return p?.[field];
      });
      
      const newPerms = [...(editingUser?.permissions || [])];
      SYSTEM_MODULES.forEach(m => {
        const idx = newPerms.findIndex(p => p.resource_name === m.id);
        if (idx >= 0) {
          newPerms[idx][field] = !allSelected;
        } else {
          newPerms.push({ resource_name: m.id, [field]: !allSelected });
        }
      });
      setEditingUser({ ...editingUser, permissions: newPerms });
    }
  }

  const generateTempPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Gestão de Acessos
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Controle usuários, perfis e permissões do sistema
          </p>
        </div>
        
        {activeTab === 'users' ? (
          <button className="btn btn-primary" onClick={() => { 
            setEditingUser({ 
              active: true,
              schedules: DEFAULT_SCHEDULES,
              permissions: []
            }); 
            setIsModalOpen(true); 
          }}>
            <UserPlus size={16} />
            Novo Usuário
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => { 
            setEditingProfile({
              name: '',
              permissions: SYSTEM_MODULES.map(m => ({
                resource_name: m.id,
                can_view: false,
                can_include: false,
                can_edit: false,
                can_delete: false,
                can_activate_inactivate: false
              })),
              schedules: DEFAULT_SCHEDULES
            }); 
            setIsProfileModalOpen(true); 
          }}>
            <Shield size={16} />
            Novo Perfil
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-list" style={{ marginBottom: '2rem' }}>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <User size={18} /> Usuários
        </button>
        <button 
          className={`tab-btn ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          <ShieldCheck size={18} /> Perfis de Acesso
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>CPF</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--brs-gray-400)' }}>Nenhum usuário encontrado</td></tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="user-avatar" style={{ width: '32px', height: '32px', overflow: 'hidden' }}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              user.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: 'var(--brs-gray-600)' }}>
                          {user.cpf ? formatCPF(user.cpf) : '-'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-navy">
                          {user.access_profiles?.name || user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.active ? 'badge-success' : 'badge-gray'}`}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={async () => {
                          // Carregar permissões via Servidor
                          const result = await getUserPermissions(user.id)
                          const perms = result.success ? result.permissions : []
                          const scheds = result.success ? result.schedules : []

                          setEditingUser({
                            ...user,
                            permissions: perms,
                            schedules: scheds.length > 0 ? scheds : DEFAULT_SCHEDULES
                          });
                          setIsModalOpen(true);
                        }}>
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
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome do Perfil</th>
                  <th>Criado em</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></td></tr>
                ) : profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td style={{ fontWeight: 600 }}>{profile.name}</td>
                    <td>{new Date(profile.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={async () => {
                        // Carregar permissões via Servidor
                        const result = await getProfilePermissions(profile.id)
                        const perms = result.success ? result.permissions : []
                        const scheds = result.success ? result.schedules : []
                        
                        const mergedPerms = SYSTEM_MODULES.map(m => {
                          const existing = perms.find((p: any) => p.resource_name === m.id)
                          return existing || {
                            resource_name: m.id,
                            can_view: false,
                            can_include: false,
                            can_edit: false,
                            can_delete: false,
                            can_activate_inactivate: false
                          }
                        })

                        // Merge schedules with default to ensure all days exist
                        const mergedScheds = DEFAULT_SCHEDULES.map(ds => {
                          const existing = scheds.find((s: any) => s.day_of_week === ds.day_of_week)
                          return existing || ds
                        })

                        setEditingProfile({ ...profile, permissions: mergedPerms, schedules: mergedScheds })
                        setIsProfileModalOpen(true)
                      }}>
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE PERFIL (Matriz de Permissões) */}
      {isProfileModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-header">
                <h3 className="modal-title">{editingProfile.id ? 'Editar Perfil' : 'Novo Perfil de Acesso'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsProfileModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {error && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} />
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nome do Perfil</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Supervisor Administrativo"
                    value={editingProfile.name}
                    onChange={e => setEditingProfile({ ...editingProfile, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Matriz de Permissões</label>
                  <div className="table-wrapper" style={{ border: '1px solid var(--brs-gray-100)', borderRadius: '8px' }}>
                    <table className="permissions-matrix">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Módulo / Recurso</th>
                          <th>Ver <input type="checkbox" onChange={() => toggleAllColumn('can_view', 'profile')} /></th>
                          <th>Incluir <input type="checkbox" onChange={() => toggleAllColumn('can_include', 'profile')} /></th>
                          <th>Editar <input type="checkbox" onChange={() => toggleAllColumn('can_edit', 'profile')} /></th>
                          <th>Excluir <input type="checkbox" onChange={() => toggleAllColumn('can_delete', 'profile')} /></th>
                          <th>Ativar/Inat. <input type="checkbox" onChange={() => toggleAllColumn('can_activate_inactivate', 'profile')} /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingProfile.permissions.map((perm: any, idx: number) => (
                          <tr key={perm.resource_name}>
                            <td className="resource-name">
                              {SYSTEM_MODULES.find(m => m.id === perm.resource_name)?.name}
                            </td>
                            <td className="checkbox-cell">
                              <input type="checkbox" checked={perm.can_view} onChange={() => togglePermission(idx, 'can_view')} />
                            </td>
                            <td className="checkbox-cell">
                              <input type="checkbox" checked={perm.can_include} onChange={() => togglePermission(idx, 'can_include')} />
                            </td>
                            <td className="checkbox-cell">
                              <input type="checkbox" checked={perm.can_edit} onChange={() => togglePermission(idx, 'can_edit')} />
                            </td>
                            <td className="checkbox-cell">
                              <input type="checkbox" checked={perm.can_delete} onChange={() => togglePermission(idx, 'can_delete')} />
                            </td>
                            <td className="checkbox-cell">
                              <input type="checkbox" checked={perm.can_activate_inactivate} onChange={() => togglePermission(idx, 'can_activate_inactivate')} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Clock size={18} color="var(--brs-navy)" />
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Horário de Acesso Permitido</h4>
                  </div>
                  <div className="schedule-grid">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, idx) => {
                      const sched = (editingProfile.schedules || DEFAULT_SCHEDULES).find((s: any) => s.day_of_week === idx) || DEFAULT_SCHEDULES[idx]
                      
                      const updateSched = (field: string, value: any) => {
                        const newScheds = [...(editingProfile.schedules || DEFAULT_SCHEDULES)]
                        const sIdx = newScheds.findIndex(s => s.day_of_week === idx)
                        if (sIdx >= 0) {
                          newScheds[sIdx] = { ...newScheds[sIdx], [field]: value }
                        } else {
                          newScheds.push({ ...DEFAULT_SCHEDULES[idx], [field]: value })
                        }
                        setEditingProfile({ ...editingProfile, schedules: newScheds })
                      }

                      return (
                        <div key={day} className="day-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                            <input 
                              type="checkbox" 
                              checked={sched.enabled} 
                              onChange={e => updateSched('enabled', e.target.checked)}
                            />
                            {day}
                          </div>
                          <div className="time-inputs">
                            <div className="form-group">
                              <label style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Entrada 1</label>
                              <input 
                                type="time" 
                                className="form-control" 
                                value={sched.start_time_1} 
                                onChange={e => updateSched('start_time_1', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Saída 1</label>
                              <input 
                                type="time" 
                                className="form-control" 
                                value={sched.end_time_1} 
                                onChange={e => updateSched('end_time_1', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Entrada 2</label>
                              <input 
                                type="time" 
                                className="form-control" 
                                value={sched.start_time_2} 
                                onChange={e => updateSched('start_time_2', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Saída 2</label>
                              <input 
                                type="time" 
                                className="form-control" 
                                value={sched.end_time_2} 
                                onChange={e => updateSched('end_time_2', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsProfileModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE USUÁRIO (Cadastro Completo) */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              setError(null);
              try {
                // Mapear o cargo para um valor aceito pela constraint do banco (minúsculo)
                const rawRole = (editingUser.role || profiles.find(p => p.id === editingUser.profile_id)?.name || 'consulta').toLowerCase();
                // Se o cargo não for um dos padrões, podemos mapear para 'gestor' ou 'consulta' como fallback
                const validRoles = ['admin', 'rh', 'gestor', 'consulta'];
                const finalRole = validRoles.includes(rawRole) ? rawRole : 'gestor';

                const result = await saveUserDirectly({
                  ...editingUser,
                  role: finalRole,
                  cpf: editingUser.cpf?.replace(/\D/g, ''), // Salvar apenas números
                  permissions: editingUser.permissions || [],
                  schedules: editingUser.schedules || []
                });

                if (!result.success) throw new Error(result.error);

                setIsModalOpen(false);
                fetchData();
              } catch (err: any) {
                setError(err.message);
              } finally {
                setSaving(false);
              }
            }}>
              <div className="modal-header">
                <h3 className="modal-title">{editingUser?.id ? 'Editar Usuário' : 'Criar Novo Usuário'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                {error && (
                  <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    {error}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '2rem' }}>
                  {/* Lado Esquerdo: Foto */}
                  <div style={{ textAlign: 'center' }}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Aqui depois implementaremos o upload para o Storage
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEditingUser({ ...editingUser, avatar_url: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div 
                      className="user-avatar" 
                      style={{ width: '120px', height: '120px', fontSize: '2.5rem', margin: '0 auto 1rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {editingUser?.avatar_url ? (
                        <img src={editingUser.avatar_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={48} />
                      )}
                      <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--brs-navy)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                        <Plus size={16} />
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>FOTO DE PERFIL</p>
                  </div>

                  {/* Lado Direito: Dados */}
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Nome Completo</label>
                      <input type="text" className="form-control" value={editingUser?.name ?? ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CPF</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="000.000.000-00" 
                        value={formatCPF(editingUser?.cpf ?? '')} 
                        onChange={e => setEditingUser({...editingUser, cpf: formatCPF(e.target.value)})} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">E-mail</label>
                      <input type="email" className="form-control" value={editingUser?.email ?? ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Perfil de Acesso</label>
                      <select 
                        className="form-control" 
                        value={editingUser?.profile_id || ''} 
                        onChange={async (e) => {
                          const profileId = e.target.value;
                          const profile = profiles.find(p => p.id === profileId);
                          // Carregar permissões e horários do perfil via Servidor
                          const result = await getProfilePermissions(profileId);
                          const perms = result.success ? result.permissions : [];
                          const scheds = result.success ? result.schedules : [];
                          
                          setEditingUser({
                            ...editingUser,
                            profile_id: profileId,
                            role: profile?.name,
                            permissions: perms,
                            schedules: scheds.length > 0 ? scheds : DEFAULT_SCHEDULES
                          });
                        }}
                        required
                      >
                        <option value="">Selecione um perfil...</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Senha Provisória</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" className="form-control" value={editingUser?.temp_password || ''} readOnly />
                        <button type="button" className="btn btn-outline" onClick={() => setEditingUser({...editingUser, temp_password: generateTempPassword()})}>
                          <Key size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tempo de Sessão (Minutos)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={editingUser?.session_timeout ?? 15} 
                        onChange={e => setEditingUser({...editingUser, session_timeout: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={editingUser?.reset_on_first ?? true} onChange={e => setEditingUser({...editingUser, reset_on_first: e.target.checked})} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Exigir alteração de senha no primeiro acesso</span>
                </div>

                {/* Tabela de Permissões (Visualização/Edição de Exceção) */}
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Shield size={18} color="var(--brs-navy)" />
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Tabela de Permissões</h4>
                  </div>
                  <div className="table-wrapper" style={{ border: '1px solid var(--brs-gray-100)', borderRadius: '8px' }}>
                    <table className="permissions-matrix">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Tela / Recurso</th>
                          <th>Ver <input type="checkbox" onChange={() => toggleAllColumn('can_view', 'user')} /></th>
                          <th>Incluir <input type="checkbox" onChange={() => toggleAllColumn('can_include', 'user')} /></th>
                          <th>Editar <input type="checkbox" onChange={() => toggleAllColumn('can_edit', 'user')} /></th>
                          <th>Excluir <input type="checkbox" onChange={() => toggleAllColumn('can_delete', 'user')} /></th>
                          <th>Ativar/Inat. <input type="checkbox" onChange={() => toggleAllColumn('can_activate_inactivate', 'user')} /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {SYSTEM_MODULES.map((module, idx) => {
                          const permIdx = editingUser?.permissions?.findIndex((p: any) => p.resource_name === module.id);
                          const perm = permIdx >= 0 ? editingUser.permissions[permIdx] : {
                            can_view: false, can_include: false, can_edit: false, can_delete: false, can_activate_inactivate: false
                          };
                          
                          const toggleUserPerm = (field: string) => {
                            const newPerms = [...(editingUser?.permissions || [])];
                            if (permIdx >= 0) {
                              newPerms[permIdx][field] = !newPerms[permIdx][field];
                            } else {
                              const newPerm = { resource_name: module.id, [field]: true };
                              newPerms.push(newPerm);
                            }
                            setEditingUser({ ...editingUser, permissions: newPerms });
                          };

                          return (
                            <tr key={module.id}>
                              <td className="resource-name">{module.name}</td>
                              <td className="checkbox-cell"><input type="checkbox" checked={perm.can_view} onChange={() => toggleUserPerm('can_view')} /></td>
                              <td className="checkbox-cell"><input type="checkbox" checked={perm.can_include} onChange={() => toggleUserPerm('can_include')} /></td>
                              <td className="checkbox-cell"><input type="checkbox" checked={perm.can_edit} onChange={() => toggleUserPerm('can_edit')} /></td>
                              <td className="checkbox-cell"><input type="checkbox" checked={perm.can_delete} onChange={() => toggleUserPerm('can_delete')} /></td>
                              <td className="checkbox-cell"><input type="checkbox" checked={perm.can_activate_inactivate} onChange={() => toggleUserPerm('can_activate_inactivate')} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Clock size={18} color="var(--brs-navy)" />
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Horário de Acesso Individual</h4>
                  </div>
                   <div className="schedule-grid">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, idx) => {
                      const sched = (editingUser?.schedules || DEFAULT_SCHEDULES).find((s: any) => s.day_of_week === idx) || DEFAULT_SCHEDULES[idx]
                      
                      const updateUserSched = (field: string, value: any) => {
                        const newScheds = [...(editingUser?.schedules || DEFAULT_SCHEDULES)]
                        const sIdx = newScheds.findIndex(s => s.day_of_week === idx)
                        if (sIdx >= 0) {
                          newScheds[sIdx] = { ...newScheds[sIdx], [field]: value }
                        } else {
                          newScheds.push({ ...DEFAULT_SCHEDULES[idx], [field]: value })
                        }
                        setEditingUser({ ...editingUser, schedules: newScheds })
                      }

                      return (
                        <div key={day} className="day-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                            <input 
                              type="checkbox" 
                              checked={sched.enabled} 
                              onChange={e => updateUserSched('enabled', e.target.checked)}
                            />
                            {day}
                          </div>
                          <div className="time-inputs">
                            <div className="form-group">
                              <label style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Entrada 1</label>
                              <input 
                                type="time" 
                                className="form-control" 
                                value={sched.start_time_1} 
                                onChange={e => updateUserSched('start_time_1', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Saída 1</label>
                              <input 
                                type="time" 
                                className="form-control" 
                                value={sched.end_time_1} 
                                onChange={e => updateUserSched('end_time_1', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Entrada 2</label>
                              <input 
                                type="time" 
                                className="form-control" 
                                value={sched.start_time_2} 
                                onChange={e => updateUserSched('start_time_2', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)' }}>Saída 2</label>
                              <input 
                                type="time" 
                                className="form-control" 
                                value={sched.end_time_2} 
                                onChange={e => updateUserSched('end_time_2', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <UserPlus size={16} />}
                  {editingUser?.id ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
