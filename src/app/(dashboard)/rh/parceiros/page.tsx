'use client'

import { useState, useEffect } from 'react'
import { getCRMData, updatePartnerCRM, executePartnerAutomation } from './actions'
import { 
  LayoutGrid, List, Search, Building2, User, Mail, Phone, MapPin, 
  CreditCard, CheckCircle, AlertCircle, Loader2, Eye, Edit2, Check, 
  ExternalLink, FileText, Sparkles, Send, Globe, Key 
} from 'lucide-react'

const CRM_STAGES = [
  { id: 'novo', name: 'Novo', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'aguarda_assinatura', name: 'Aguardando Assinatura', color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'assinatura_realizada', name: 'Assinatura Realizada', color: '#10B981', bg: '#ECFDF5' },
  { id: 'validacao_final', name: 'Validação Final', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'finalizado', name: 'Finalizado', color: '#059669', bg: '#E6F4EA' }
]

export default function ParceirosCRMPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [partners, setPartners] = useState<any[]>([])
  const [entities, setEntities] = useState<any[]>([])
  
  // Loading & Error States
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [savingDetails, setSavingDetails] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSuperintendente, setFilterSuperintendente] = useState('')
  const [filterSupervisor, setFilterSupervisor] = useState('')
  const [filterGerente, setFilterGerente] = useState('')

  // Edit / Details Modal State
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'dados' | 'endereco' | 'banco' | 'documentos' | 'automacao'>('dados')
  
  // Automation Form Inputs
  const [arwCodeInput, setArwCodeInput] = useState('')
  const [tempPasswordInput, setTempPasswordInput] = useState('')
  const [driveUrlInput, setDriveUrlInput] = useState('')
  const [customMsgInput, setCustomMsgInput] = useState('')
  const [runningAutomation, setRunningAutomation] = useState(false)

  async function loadData() {
    setLoading(true)
    const res = await getCRMData()
    if (res.success && res.partners && res.commercialEntities) {
      setPartners(res.partners)
      setEntities(res.commercialEntities)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Cascade Filter logic
  const filteredSuperintendentes = entities.filter(e => e.role === 'superintendente')
  const filteredSupervisores = entities.filter(
    e => e.role === 'supervisor' && (!filterSuperintendente || e.parent_id === filterSuperintendente)
  )
  const filteredGerentes = entities.filter(
    e => e.role === 'gerente' && (!filterSupervisor || e.parent_id === filterSupervisor)
  )

  // Filtering Partners
  const filteredPartners = partners.filter(p => {
    // Search filter
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cpf_cnpj.includes(searchTerm) ||
      (p.arw_code && p.arw_code.toLowerCase().includes(searchTerm.toLowerCase()))

    // Hierarchy filters
    const matchesSuper = !filterSuperintendente || p.superintendente_id === filterSuperintendente
    const matchesSuperv = !filterSupervisor || p.supervisor_id === filterSupervisor
    const matchesGerente = !filterGerente || p.gerente_id === filterGerente

    return matchesSearch && matchesSuper && matchesSuperv && matchesGerente
  })

  // Quick Move Stage
  async function handleMoveStage(partnerId: string, newStatus: any) {
    setUpdatingId(partnerId)
    const res = await updatePartnerCRM({ id: partnerId, status: newStatus })
    if (res.success) {
      setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, status: newStatus } : p))
    }
    setUpdatingId(null)
  }

  // Open Edit Modal
  function handleOpenDetails(partner: any) {
    setSelectedPartner({ ...partner })
    setArwCodeInput(partner.arw_code || '')
    setTempPasswordInput(partner.temporary_password || '')
    setDriveUrlInput(partner.google_drive_url || '')
    setCustomMsgInput('')
    setActiveTab('dados')
    setMessage(null)
  }

  // Save general modifications inside Modal
  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPartner) return
    
    setSavingDetails(true)
    setMessage(null)

    const res = await updatePartnerCRM({
      id: selectedPartner.id,
      superintendente_id: selectedPartner.superintendente_id,
      supervisor_id: selectedPartner.supervisor_id,
      gerente_id: selectedPartner.gerente_id,
      arw_code: selectedPartner.arw_code,
      temporary_password: selectedPartner.temporary_password,
      google_drive_url: selectedPartner.google_drive_url,
      filial: selectedPartner.filial,
      nivel_acesso: selectedPartner.nivel_acesso,
      tipo_agente: selectedPartner.tipo_agente,
      regra_fisico: selectedPartner.regra_fisico
    })

    if (res.success) {
      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' })
      loadData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao salvar alterações.' })
    }
    setSavingDetails(false)
  }

  // Run Automations
  async function runAutomation(type: 'contrato' | 'whatsapp' | 'email' | 'aprovar') {
    if (!selectedPartner) return
    setRunningAutomation(true)
    setMessage(null)

    let paramsObj: any = {}
    if (type === 'whatsapp') {
      paramsObj.message = customMsgInput || undefined
    } else if (type === 'aprovar') {
      paramsObj = {
        arw_code: arwCodeInput,
        temporary_password: tempPasswordInput,
        google_drive_url: driveUrlInput
      }
    }

    const res = await executePartnerAutomation(selectedPartner.id, type, paramsObj)
    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'Automação executada com sucesso!' })
      // Update local state and inputs
      if (type === 'contrato' && res.signatureUrl) {
        setSelectedPartner((prev: any) => ({ 
          ...prev, 
          status: 'aguarda_assinatura', 
          assinafy_signature_url: res.signatureUrl 
        }))
      } else if (type === 'aprovar') {
        setSelectedPartner((prev: any) => ({ 
          ...prev, 
          status: 'finalizado', 
          arw_code: arwCodeInput,
          temporary_password: tempPasswordInput || prev.temporary_password,
          google_drive_url: driveUrlInput
        }))
      }
      loadData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao processar a automação.' })
    }
    setRunningAutomation(false)
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} />
      </div>
    )
  }

  return (
    <div className="page-content">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            CRM SCP & Cadastro de Parceiros
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Acompanhe o funil de credenciamento e gerencie os parceiros comerciais da BRS Promotora
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--brs-gray-100)', padding: '4px', borderRadius: '8px' }}>
          <button 
            className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('kanban')}
            style={{ margin: 0, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <LayoutGrid size={14} />
            Funil Kanban
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('table')}
            style={{ margin: 0, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <List size={14} />
            Tabela
          </button>
        </div>
      </div>

      {/* FILTROS HIERÁRQUICOS */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Buscar Parceiro</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nome, CPF/CNPJ ou Cód ARW..." 
                style={{ paddingLeft: '2rem' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--brs-gray-400)' }} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Superintendente</label>
            <select 
              className="form-control"
              value={filterSuperintendente}
              onChange={e => {
                setFilterSuperintendente(e.target.value)
                setFilterSupervisor('')
                setFilterGerente('')
              }}
            >
              <option value="">Todos</option>
              {filteredSuperintendentes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Supervisor</label>
            <select 
              className="form-control"
              value={filterSupervisor}
              onChange={e => {
                setFilterSupervisor(e.target.value)
                setFilterGerente('')
              }}
            >
              <option value="">Todos</option>
              {filteredSupervisores.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Gerente Comercial</label>
            <select 
              className="form-control"
              value={filterGerente}
              onChange={e => setFilterGerente(e.target.value)}
            >
              <option value="">Todos</option>
              {filteredGerentes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* VIEW: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'start' }}>
          {CRM_STAGES.map(stage => {
            const stagePartners = filteredPartners.filter(p => p.status === stage.id)

            return (
              <div 
                key={stage.id} 
                style={{ 
                  background: 'var(--brs-gray-50)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--brs-gray-100)', 
                  padding: '0.75rem',
                  minHeight: '400px'
                }}
              >
                {/* Stage Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--brs-gray-700)' }}>
                      {stage.name}
                    </span>
                  </div>
                  <span style={{ 
                    background: stage.color, 
                    color: 'white', 
                    fontSize: '0.7rem', 
                    padding: '2px 6px', 
                    borderRadius: '10px', 
                    fontWeight: 700 
                  }}>
                    {stagePartners.length}
                  </span>
                </div>

                {/* Stage Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stagePartners.map(partner => (
                    <div 
                      key={partner.id} 
                      className="card card-hover"
                      style={{ 
                        padding: '0.85rem', 
                        border: '1px solid var(--brs-gray-100)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--brs-gray-800)', marginBottom: '0.25rem' }}>
                        {partner.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
                        {partner.cpf_cnpj}
                      </div>

                      {/* Info Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: 'var(--brs-gray-600)' }}>
                          {partner.person_type}
                        </span>
                        {partner.arw_code && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--brs-navy)', color: '#white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            ARW: {partner.arw_code}
                          </span>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--brs-gray-100)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => handleOpenDetails(partner)}
                          style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Eye size={12} />
                          Ver Detalhes
                        </button>

                        <select 
                          className="form-control"
                          value={partner.status}
                          disabled={updatingId === partner.id}
                          onChange={(e) => handleMoveStage(partner.id, e.target.value)}
                          style={{ width: 'auto', padding: '2px 4px', fontSize: '0.7rem', height: 'auto', margin: 0 }}
                        >
                          {CRM_STAGES.map(st => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stagePartners.length === 0 && (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--brs-gray-400)', border: '1px dashed var(--brs-gray-200)', borderRadius: '8px' }}>
                      Nenhum parceiro
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      ) : (
        /* VIEW: TABLE LIST */
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Documento</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th>Hierarquia Responsável</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--brs-gray-400)' }}>
                      Nenhum parceiro encontrado
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.fantasy_name && <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{p.fantasy_name}</div>}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.cpf_cnpj}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={12} /> {p.phone_whatsapp}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={12} /> {p.email_comissao}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          background: CRM_STAGES.find(s => s.id === p.status)?.bg || '#eee',
                          color: CRM_STAGES.find(s => s.id === p.status)?.color || '#333',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>
                          {CRM_STAGES.find(s => s.id === p.status)?.name}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span><strong>Superint.:</strong> {p.superintendente?.name || '-'}</span>
                          <span><strong>Superv.:</strong> {p.supervisor?.name || '-'}</span>
                          <span><strong>Gerente:</strong> {p.gerente?.name || '-'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleOpenDetails(p)}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedPartner && (
        <div className="modal-backdrop" onClick={() => setSelectedPartner(null)}>
          <div className="modal" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>Detalhes do Credenciamento</h3>
                <span style={{ 
                  background: CRM_STAGES.find(s => s.id === selectedPartner.status)?.bg || '#eee',
                  color: CRM_STAGES.find(s => s.id === selectedPartner.status)?.color || '#333',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginTop: '0.25rem'
                }}>
                  Status: {CRM_STAGES.find(s => s.id === selectedPartner.status)?.name}
                </span>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setSelectedPartner(null)}>
                Fechar
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--brs-gray-200)', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button 
                type="button"
                className={`btn btn-sm ${activeTab === 'dados' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('dados')}
                style={{ margin: 0, borderRadius: '8px 8px 0 0' }}
              >
                Dados Gerais
              </button>
              <button 
                type="button"
                className={`btn btn-sm ${activeTab === 'endereco' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('endereco')}
                style={{ margin: 0, borderRadius: '8px 8px 0 0' }}
              >
                Endereço & Contatos
              </button>
              <button 
                type="button"
                className={`btn btn-sm ${activeTab === 'banco' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('banco')}
                style={{ margin: 0, borderRadius: '8px 8px 0 0' }}
              >
                Dados Bancários
              </button>
              <button 
                type="button"
                className={`btn btn-sm ${activeTab === 'documentos' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('documentos')}
                style={{ margin: 0, borderRadius: '8px 8px 0 0' }}
              >
                Documentos Anexos
              </button>
              <button 
                type="button"
                className={`btn btn-sm ${activeTab === 'automacao' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('automacao')}
                style={{ margin: 0, borderRadius: '8px 8px 0 0', color: 'var(--brs-navy)', fontWeight: 600 }}
              >
                <Sparkles size={14} style={{ marginRight: '0.25rem' }} />
                Integrações & Acesso
              </button>
            </div>

            {message && (
              <div 
                style={{ 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  marginBottom: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: message.type === 'success' ? '#065F46' : '#991B1B',
                  border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`
                }}
              >
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveDetails}>
              <div className="modal-body" style={{ padding: '0.5rem 0' }}>
                
                {/* TAB 1: DADOS GERAIS */}
                {activeTab === 'dados' && (
                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Nome / Razão Social</label>
                      <input type="text" className="form-control" value={selectedPartner.name || ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CPF / CNPJ</label>
                      <input type="text" className="form-control" value={selectedPartner.cpf_cnpj || ''} readOnly />
                    </div>
                    {selectedPartner.person_type === 'PJ' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Nome Fantasia</label>
                          <input type="text" className="form-control" value={selectedPartner.fantasy_name || ''} readOnly />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Representante Legal</label>
                          <input type="text" className="form-control" value={selectedPartner.representante_legal || ''} readOnly />
                        </div>
                      </>
                    )}

                    {/* Vínculo de Hierarquia Comercial (Cascateado) */}
                    <div style={{ gridColumn: 'span 2', marginTop: '1rem', borderTop: '1px solid var(--brs-gray-100)', paddingTop: '1rem' }}>
                      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--brs-gray-700)' }}>Hierarquia Comercial Atribuída</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Superintendente</label>
                          <select 
                            className="form-control"
                            value={selectedPartner.superintendente_id || ''}
                            onChange={e => setSelectedPartner({ 
                              ...selectedPartner, 
                              superintendente_id: e.target.value || null,
                              supervisor_id: null,
                              gerente_id: null
                            })}
                          >
                            <option value="">Selecione...</option>
                            {entities.filter(ent => ent.role === 'superintendente').map(ent => (
                              <option key={ent.id} value={ent.id}>{ent.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Supervisor</label>
                          <select 
                            className="form-control"
                            value={selectedPartner.supervisor_id || ''}
                            onChange={e => setSelectedPartner({ 
                              ...selectedPartner, 
                              supervisor_id: e.target.value || null,
                              gerente_id: null
                            })}
                          >
                            <option value="">Selecione...</option>
                            {entities
                              .filter(ent => ent.role === 'supervisor' && (!selectedPartner.superintendente_id || ent.parent_id === selectedPartner.superintendente_id))
                              .map(ent => (
                                <option key={ent.id} value={ent.id}>{ent.name}</option>
                              ))
                            }
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Gerente</label>
                          <select 
                            className="form-control"
                            value={selectedPartner.gerente_id || ''}
                            onChange={e => setSelectedPartner({ 
                              ...selectedPartner, 
                              gerente_id: e.target.value || null
                            })}
                          >
                            <option value="">Selecione...</option>
                            {entities
                              .filter(ent => ent.role === 'gerente' && (!selectedPartner.supervisor_id || ent.parent_id === selectedPartner.supervisor_id))
                              .map(ent => (
                                <option key={ent.id} value={ent.id}>{ent.name}</option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* CNPJ Rich Data (da API publica.cnpj.ws) */}
                    {selectedPartner.additional_data?.cnpj_rich_info && (
                      <div style={{ gridColumn: 'span 2', marginTop: '1.5rem', borderTop: '1px solid var(--brs-gray-100)', paddingTop: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--brs-navy)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building2 size={16} style={{ color: 'var(--brs-navy)' }} />
                          Informações Adicionais do CNPJ (Receita Federal)
                        </h4>
                        
                        <div style={{ background: 'var(--brs-gray-50)', border: '1px solid var(--brs-gray-100)', borderRadius: '10px', padding: '1.25rem', fontSize: '0.8rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <span style={{ color: 'var(--brs-gray-400)', display: 'block', marginBottom: '0.2rem' }}>Situação Cadastral</span>
                              <span style={{ fontWeight: 600, color: selectedPartner.additional_data.cnpj_rich_info.situacao_cadastral === 'Ativa' ? '#059669' : '#DC2626' }}>
                                {selectedPartner.additional_data.cnpj_rich_info.situacao_cadastral}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--brs-gray-400)', display: 'block', marginBottom: '0.2rem' }}>Data de Abertura</span>
                              <span style={{ fontWeight: 600 }}>{selectedPartner.additional_data.cnpj_rich_info.data_abertura || '-'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--brs-gray-400)', display: 'block', marginBottom: '0.2rem' }}>Capital Social</span>
                              <span style={{ fontWeight: 600 }}>
                                {selectedPartner.additional_data.cnpj_rich_info.capital_social 
                                  ? Number(selectedPartner.additional_data.cnpj_rich_info.capital_social).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                  : '-'}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--brs-gray-400)', display: 'block', marginBottom: '0.2rem' }}>Natureza Jurídica</span>
                              <span style={{ fontWeight: 600 }}>{selectedPartner.additional_data.cnpj_rich_info.natureza_juridica || '-'}</span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: 'var(--brs-gray-400)', display: 'block', marginBottom: '0.2rem' }}>CNAE Principal</span>
                              <span style={{ fontWeight: 600 }}>{selectedPartner.additional_data.cnpj_rich_info.cnae_principal || '-'}</span>
                            </div>
                          </div>

                          {selectedPartner.additional_data.cnpj_rich_info.socios && selectedPartner.additional_data.cnpj_rich_info.socios.length > 0 && (
                            <div style={{ borderTop: '1px solid var(--brs-gray-200)', paddingTop: '1rem', marginTop: '1rem' }}>
                              <span style={{ color: 'var(--brs-gray-400)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Quadro de Sócios e Administradores (QSA)</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {selectedPartner.additional_data.cnpj_rich_info.socios.map((socio: any, idx: number) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--brs-gray-100)' }}>
                                    <span style={{ fontWeight: 600 }}>{socio.nome}</span>
                                    <span style={{ color: 'var(--brs-gray-400)', fontSize: '0.75rem' }}>{socio.cargo}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: ENDEREÇO & CONTATOS */}
                {activeTab === 'endereco' && (
                  <div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>Contatos Cadastrados</h4>
                    <div className="form-grid form-grid-2" style={{ marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">WhatsApp Celular</label>
                        <input type="text" className="form-control" value={selectedPartner.phone_whatsapp || ''} readOnly />
                      </div>
                      <div className="form-group">
                        <label className="form-label">E-mail Comissão</label>
                        <input type="text" className="form-control" value={selectedPartner.email_comissao || ''} readOnly />
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>Endereço Comercial</h4>
                    <div className="form-grid form-grid-3">
                      <div className="form-group">
                        <label className="form-label">CEP</label>
                        <input type="text" className="form-control" value={selectedPartner.cep || ''} readOnly />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Rua</label>
                        <input type="text" className="form-control" value={selectedPartner.address_street || ''} readOnly />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Número</label>
                        <input type="text" className="form-control" value={selectedPartner.address_number || ''} readOnly />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bairro</label>
                        <input type="text" className="form-control" value={selectedPartner.address_neighborhood || ''} readOnly />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cidade / UF</label>
                        <input type="text" className="form-control" value={`${selectedPartner.address_city || ''} - ${selectedPartner.address_state || ''}`} readOnly />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: DADOS BANCÁRIOS */}
                {activeTab === 'banco' && (
                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Tipo de Recebimento</label>
                      <input type="text" className="form-control" value={selectedPartner.commission_receive_type || ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Banco</label>
                      <input type="text" className="form-control" value={selectedPartner.bank_name || ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Agência</label>
                      <input type="text" className="form-control" value={selectedPartner.bank_agency || ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Conta</label>
                      <input type="text" className="form-control" value={selectedPartner.bank_account || ''} readOnly />
                    </div>
                    {selectedPartner.pix_type && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Tipo Chave PIX</label>
                          <input type="text" className="form-control" value={selectedPartner.pix_type || ''} readOnly />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Chave PIX</label>
                          <input type="text" className="form-control" value={selectedPartner.pix_key || ''} readOnly />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 4: DOCUMENTOS ANEXOS */}
                {activeTab === 'documentos' && (
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Anexos do Formulário Dinâmico</h4>
                    
                    {selectedPartner.additional_data && Object.keys(selectedPartner.additional_data).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(selectedPartner.additional_data).map(([key, val]: any) => {
                          const isFileUrl = typeof val === 'string' && val.startsWith('http')
                          
                          return (
                            <div 
                              key={key} 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '0.75rem', 
                                border: '1px solid var(--brs-gray-100)', 
                                borderRadius: '8px',
                                background: 'var(--brs-gray-50)'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--brs-gray-700)' }}>
                                  {key.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--brs-gray-400)', marginTop: '0.15rem' }}>
                                  {isFileUrl ? 'Arquivo de Documento' : 'Informação Textual'}
                                </div>
                              </div>

                              {isFileUrl ? (
                                <a 
                                  href={val} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-outline btn-sm"
                                  style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', textDecoration: 'none', color: 'var(--brs-navy)', borderColor: 'var(--brs-navy)' }}
                                >
                                  <ExternalLink size={12} />
                                  Visualizar Documento
                                </a>
                              ) : (
                                <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>{val}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--brs-gray-400)', fontSize: '0.85rem' }}>
                        Nenhum anexo ou resposta dinâmica cadastrada.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: INTEGRAÇÕES & AUTOMAÇÕES */}
                {activeTab === 'automacao' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* 1. ASSINAFY */}
                    <div style={{ border: '1px solid var(--brs-gray-100)', padding: '1rem', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FileText size={16} color="var(--brs-navy)" />
                          Integração Assinafy (Assinatura de Contrato)
                        </span>
                        {selectedPartner.assinafy_signature_url && (
                          <span style={{ fontSize: '0.7rem', background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                            Contrato Gerado
                          </span>
                        )}
                      </div>
                      
                      <p style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)', margin: '0 0 1rem 0' }}>
                        Dispara a assinatura eletrônica do modelo de credenciamento configurado via Assinafy.
                      </p>

                      {selectedPartner.assinafy_signature_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a 
                            href={selectedPartner.assinafy_signature_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-outline btn-sm"
                            style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', textDecoration: 'none' }}
                          >
                            <ExternalLink size={12} />
                            Link da Assinatura
                          </a>
                          <span style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>ID Doc: {selectedPartner.assinafy_document_id}</span>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm" 
                          disabled={runningAutomation}
                          onClick={() => runAutomation('contrato')}
                          style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}
                        >
                          {runningAutomation ? <Loader2 size={12} className="spinner" /> : <Sparkles size={12} />}
                          Gerar e Enviar Contrato Assinafy
                        </button>
                      )}
                    </div>

                    {/* 2. Z-API / WHATSAPP */}
                    <div style={{ border: '1px solid var(--brs-gray-100)', padding: '1rem', borderRadius: '10px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                        <Send size={16} color="#10B981" />
                        Disparo de Mensagem WhatsApp (Z-API)
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)', margin: '0 0 0.75rem 0' }}>
                        Dispare avisos no WhatsApp do parceiro (ex: cobrança de assinatura ou instruções).
                      </p>
                      
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <textarea 
                          className="form-control" 
                          placeholder="Mensagem customizada. Deixe em branco para usar o aviso padrão de cobrança..." 
                          value={customMsgInput}
                          onChange={e => setCustomMsgInput(e.target.value)}
                          style={{ minHeight: '60px', fontSize: '0.75rem' }}
                        />
                      </div>

                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        disabled={runningAutomation}
                        onClick={() => runAutomation('whatsapp')}
                        style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', borderColor: '#10B981', color: '#10B981' }}
                      >
                        {runningAutomation ? <Loader2 size={12} className="spinner" /> : <Send size={12} />}
                        Disparar WhatsApp
                      </button>
                    </div>

                    {/* 3. FINALIZAÇÃO & ACESSO */}
                    <div style={{ border: '1px solid var(--brs-gray-100)', padding: '1rem', borderRadius: '10px', background: 'rgba(138, 43, 226, 0.02)' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem', color: 'var(--brs-navy)' }}>
                        <Key size={16} />
                        Finalização de Credenciamento & Acesso do Workspace
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)', margin: '0 0 1rem 0' }}>
                        Ao aprovar o parceiro, informe as credenciais de credenciamento do ARW. O sistema criará uma conta de login automaticamente e enviará as credenciais.
                      </p>

                      <div className="form-grid form-grid-3" style={{ marginBottom: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Código ARW</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            required={selectedPartner.status !== 'finalizado'}
                            disabled={selectedPartner.status === 'finalizado'}
                            placeholder="Ex: AGENT01"
                            value={arwCodeInput}
                            onChange={e => setArwCodeInput(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Senha Provisória</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            disabled={selectedPartner.status === 'finalizado'}
                            placeholder="Deixe em branco para auto-gerar"
                            value={tempPasswordInput}
                            onChange={e => setTempPasswordInput(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Link Pasta Google Drive</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="https://drive.google.com/..."
                            value={driveUrlInput}
                            onChange={e => setDriveUrlInput(e.target.value)}
                          />
                        </div>
                      </div>

                      {selectedPartner.status === 'finalizado' ? (
                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={14} />
                          <span>Este parceiro já foi finalizado. Acesso criado com o e-mail cadastrado.</span>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm" 
                          disabled={runningAutomation || !arwCodeInput}
                          onClick={() => runAutomation('aprovar')}
                          style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', background: 'var(--brs-navy)' }}
                        >
                          {runningAutomation ? <Loader2 size={12} className="spinner" /> : <Check size={12} />}
                          Aprovar Parceiro & Criar Usuário
                        </button>
                      )}
                    </div>

                  </div>
                )}

              </div>
              
              <div className="modal-footer" style={{ borderTop: '1px solid var(--brs-gray-100)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedPartner(null)}>
                  Fechar
                </button>
                {activeTab === 'dados' && (
                  <button type="submit" className="btn btn-primary" disabled={savingDetails}>
                    {savingDetails ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                    Salvar Alterações de Dados
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
