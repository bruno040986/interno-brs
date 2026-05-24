'use client'

import { useState, useEffect } from 'react'
import { getCommercialEntities, saveCommercialEntity, deleteCommercialEntity } from '../../actions'
import { Users, Plus, Edit2, Trash2, X, Save, FolderOpen, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react'

interface Entity {
  id: string
  name: string
  cpf_cnpj: string
  role: 'superintendente' | 'supervisor' | 'gerente'
  parent_id: string | null
  user_id: string | null
  status: 'ativo' | 'inativo'
  arw_code?: string
  filial?: string
  nivel_acesso?: string
  tipo_agente?: string
  regra_fisico?: string
  phone_whatsapp?: string
  email_comissao?: string
  google_drive_url?: string
  parent?: { id: string; name: string; role: string }
}

export default function ComercialConfigPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [systemUsers, setSystemUsers] = useState<{ id: string; name: string; email: string; cpf: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<Partial<Entity> | null>(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  async function loadData() {
    setLoading(true)
    const res = await getCommercialEntities()
    if (res.success && res.entities && res.systemUsers) {
      setEntities(res.entities as Entity[])
      setSystemUsers(res.systemUsers)
    } else {
      setMessage({ type: 'error', text: 'Erro ao carregar dados comerciais.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingEntity?.name || !editingEntity?.role || !editingEntity?.cpf_cnpj) {
      setMessage({ type: 'error', text: 'Nome, Cargo e CPF/CNPJ são obrigatórios.' })
      return
    }

    setSaving(true)
    setMessage(null)

    const res = await saveCommercialEntity(editingEntity as any)
    if (res.success) {
      setMessage({ type: 'success', text: 'Entidade comercial salva com sucesso!' })
      setIsModalOpen(false)
      setEditingEntity(null)
      loadData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao salvar entidade.' })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente inativar esta entidade comercial?')) return

    const res = await deleteCommercialEntity(id)
    if (res.success) {
      setMessage({ type: 'success', text: 'Entidade comercial inativada.' })
      loadData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao inativar.' })
    }
  }

  function openCreateModal() {
    setEditingEntity({
      name: '',
      cpf_cnpj: '',
      role: 'gerente',
      status: 'ativo',
      parent_id: null,
      user_id: null,
      arw_code: '',
      filial: '',
      nivel_acesso: '',
      tipo_agente: '',
      regra_fisico: '',
      phone_whatsapp: '',
      email_comissao: '',
      google_drive_url: ''
    })
    setIsModalOpen(true)
  }

  function openEditModal(entity: Entity) {
    setEditingEntity(entity)
    setIsModalOpen(true)
  }

  // Filtragem local
  const filteredEntities = entities.filter(ent => {
    const matchesSearch = ent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ent.cpf_cnpj.includes(searchQuery) ||
                          (ent.arw_code && ent.arw_code.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRole = roleFilter === 'all' || ent.role === roleFilter
    return matchesSearch && matchesRole && ent.status === 'ativo'
  })

  // Listagens filtradas por cargo para preenchimento de dependências
  const superintendentes = entities.filter(e => e.role === 'superintendente' && e.status === 'ativo')
  const supervisores = entities.filter(e => e.role === 'supervisor' && e.status === 'ativo')

  // Ao selecionar um usuário do sistema, autocompleta Nome e CPF/CNPJ se disponíveis
  function handleUserSelect(userId: string) {
    const selected = systemUsers.find(u => u.id === userId)
    if (selected && editingEntity) {
      setEditingEntity({
        ...editingEntity,
        user_id: userId,
        name: editingEntity.name || selected.name,
        cpf_cnpj: editingEntity.cpf_cnpj || selected.cpf || '',
        email_comissao: editingEntity.email_comissao || selected.email
      })
    } else if (editingEntity) {
      setEditingEntity({ ...editingEntity, user_id: null })
    }
  }

  // Lógica de cascata: filtra os supervisores disponíveis de acordo com o superintendente selecionado
  const availableSupervisors = editingEntity?.parent_id ? supervisores : supervisores

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Estrutura Comercial BRS Promotora
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Gerencie os superintendentes, supervisores e gerentes comerciais da carteira
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          Nova Entidade Comercial
        </button>
      </div>

      {message && (
        <div 
          style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`
          }}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message.text}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--brs-gray-400)' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Buscar por nome, CPF/CNPJ ou código ARW..." 
            style={{ paddingLeft: '2.25rem', width: '100%' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="form-control" 
          style={{ width: '200px' }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="all">Todos os cargos</option>
          <option value="superintendente">Superintendente</option>
          <option value="supervisor">Supervisor</option>
          <option value="gerente">Gerente Comercial</option>
        </select>
      </div>

      {/* Grid / Tabela de Entidades */}
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome / Razão</th>
                <th>CPF/CNPJ</th>
                <th>Cargo</th>
                <th>Subordinação</th>
                <th>Cód. ARW</th>
                <th>Links</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} />
                  </td>
                </tr>
              ) : filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <Users size={48} style={{ color: 'var(--brs-gray-300)', marginBottom: '1rem' }} />
                      <h3>Nenhuma entidade comercial cadastrada</h3>
                      <p>Adicione supervisores ou gerentes para iniciar a montagem da árvore.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntities.map((ent) => (
                  <tr key={ent.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{ent.name}</div>
                      {ent.email_comissao && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{ent.email_comissao}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{ent.cpf_cnpj}</td>
                    <td>
                      <span className={`badge ${
                        ent.role === 'superintendente' ? 'badge-primary' : 
                        ent.role === 'supervisor' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {ent.role === 'superintendente' ? 'Superintendente' : 
                         ent.role === 'supervisor' ? 'Supervisor' : 'Gerente'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {ent.parent ? (
                        <div>
                          {ent.parent.name}{' '}
                          <small style={{ color: 'var(--brs-gray-400)' }}>({ent.parent.role})</small>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--brs-gray-300)' }}>- Direto</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>{ent.arw_code || '-'}</td>
                    <td>
                      {ent.google_drive_url ? (
                        <a 
                          href={ent.google_drive_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3B82F6', fontSize: '0.875rem', textDecoration: 'none' }}
                        >
                          <FolderOpen size={16} />
                          Drive
                        </a>
                      ) : (
                        <span style={{ color: 'var(--brs-gray-300)', fontSize: '0.875rem' }}>Sem Link</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditModal(ent)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(ent.id)}>
                          <Trash2 size={16} />
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

      {/* Modal de Criação / Edição */}
      {isModalOpen && editingEntity && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '650px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingEntity.id ? 'Editar Entidade Comercial' : 'Nova Entidade Comercial'}
                </h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                
                {/* Usuário de Sistema (Link opcional) */}
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Vincular a Usuário do Workspace (Opcional)</label>
                  <select 
                    className="form-control"
                    value={editingEntity.user_id || ''}
                    onChange={e => handleUserSelect(e.target.value)}
                  >
                    <option value="">Não vincular a usuário de acesso</option>
                    {systemUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>
                    Ao vincular, o usuário herdará as travas de visualizações correspondentes a esta vaga comercial no CRM.
                  </p>
                </div>

                <div className="form-grid form-grid-2">
                  {/* Nome */}
                  <div className="form-group">
                    <label className="form-label">Nome Completo / Razão Social <span className="required">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      placeholder="Ex: Maria das Dores"
                      value={editingEntity.name || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, name: e.target.value })}
                    />
                  </div>

                  {/* CPF / CNPJ */}
                  <div className="form-group">
                    <label className="form-label">CPF ou CNPJ <span className="required">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required
                      placeholder="Somente números"
                      value={editingEntity.cpf_cnpj || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, cpf_cnpj: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  {/* Cargo */}
                  <div className="form-group">
                    <label className="form-label">Cargo Comercial <span className="required">*</span></label>
                    <select 
                      className="form-control"
                      value={editingEntity.role || 'gerente'}
                      onChange={e => setEditingEntity({ 
                        ...editingEntity, 
                        role: e.target.value as any,
                        parent_id: null // Reseta pai ao mudar de cargo
                      })}
                    >
                      <option value="superintendente">Superintendente</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="gerente">Gerente Comercial</option>
                    </select>
                  </div>

                  {/* Subordinação (Filtro Cascata) */}
                  <div className="form-group">
                    {editingEntity.role === 'supervisor' && (
                      <>
                        <label className="form-label">Superintendente Vinculado <span className="required">*</span></label>
                        <select 
                          className="form-control"
                          required
                          value={editingEntity.parent_id || ''}
                          onChange={e => setEditingEntity({ ...editingEntity, parent_id: e.target.value })}
                        >
                          <option value="">Selecione o Superintendente...</option>
                          {superintendentes.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </>
                    )}

                    {editingEntity.role === 'gerente' && (
                      <>
                        <label className="form-label">Supervisor Vinculado <span className="required">*</span></label>
                        <select 
                          className="form-control"
                          required
                          value={editingEntity.parent_id || ''}
                          onChange={e => setEditingEntity({ ...editingEntity, parent_id: e.target.value })}
                        >
                          <option value="">Selecione o Supervisor...</option>
                          {availableSupervisors.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </>
                    )}

                    {editingEntity.role === 'superintendente' && (
                      <>
                        <label className="form-label">Superiores</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          disabled 
                          value="Superintendência Direta (Sem subordinação)" 
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Dados de Contato */}
                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">WhatsApp Celular</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="(99) 99999-9999"
                      value={editingEntity.phone_whatsapp || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, phone_whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail de Comissão</label>
                    <input 
                      type="email" 
                      className="form-control"
                      placeholder="email@dominio.com"
                      value={editingEntity.email_comissao || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, email_comissao: e.target.value })}
                    />
                  </div>
                </div>

                {/* Dados do ARW */}
                <div style={{ margin: '1.5rem 0 0.75rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--brs-gray-800)', borderBottom: '1px solid var(--brs-gray-100)', paddingBottom: '0.25rem' }}>
                  Parâmetros de Integração com o ARW
                </div>

                <div className="form-grid form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Código Agente ARW</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={editingEntity.arw_code || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, arw_code: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Filial</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={editingEntity.filial || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, filial: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Regra de Físico</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={editingEntity.regra_fisico || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, regra_fisico: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Nível de Acesso ARW</label>
                    <select 
                      className="form-control"
                      value={editingEntity.nivel_acesso || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, nivel_acesso: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="DIRETORIA">DIRETORIA</option>
                      <option value="GERENTE">GERENTE</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="SUPORTE">SUPORTE</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo de Agente ARW</label>
                    <select 
                      className="form-control"
                      value={editingEntity.tipo_agente || ''}
                      onChange={e => setEditingEntity({ ...editingEntity, tipo_agente: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="ADAMANTIUM">ADAMANTIUM</option>
                      <option value="BRONZE">BRONZE</option>
                      <option value="DIAMANTE">DIAMANTE</option>
                      <option value="GERENTE COMERCIAL">GERENTE COMERCIAL</option>
                      <option value="LOJA / PARCEIRO">LOJA / PARCEIRO</option>
                      <option value="OURO">OURO</option>
                      <option value="PRATA">PRATA</option>
                      <option value="RUBI">RUBI</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                    </select>
                  </div>
                </div>

                {/* Google Drive Link */}
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Link da Pasta de Documentos no Google Drive</label>
                  <input 
                    type="url" 
                    className="form-control"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={editingEntity.google_drive_url || ''}
                    onChange={e => setEditingEntity({ ...editingEntity, google_drive_url: e.target.value })}
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
