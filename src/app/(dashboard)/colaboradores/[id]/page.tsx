'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Bus, AlertTriangle, ChevronLeft, MapPin, 
  Briefcase, Phone, Mail, Calendar, CreditCard,
  FileText, Download, Trash2, History
} from 'lucide-react'
import Link from 'next/link'
import type { Employee, VtRecord, DisciplinaryRecord } from '@/types'

export default function PerfilColaboradorPage() {
  const { id } = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [vtRecords, setVtRecords] = useState<VtRecord[]>([])
  const [discRecords, setDiscRecords] = useState<DisciplinaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dados')
  
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    
    const [empRes, vtRes, discRes] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).single(),
      supabase.from('vt_records').select('*, unit:company_units(*)').eq('employee_id', id).order('generated_at', { ascending: false }),
      supabase.from('disciplinary_records').select('*, reason:disciplinary_reasons(*)').eq('employee_id', id).order('occurrence_date', { ascending: false })
    ])
    
    if (empRes.data) setEmployee(empRes.data as Employee)
    if (vtRes.data) setVtRecords(vtRes.data as VtRecord[])
    if (discRes.data) setDiscRecords(discRes.data as DisciplinaryRecord[])
    
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)', width: 40, height: 40 }} />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="page-content">
        <div className="alert alert-error">Colaborador não encontrado.</div>
        <button className="btn btn-outline" onClick={() => router.back()}>Voltar</button>
      </div>
    )
  }

  function maskCpf(cpf: string) {
    const clean = cpf.replace(/\D/g, '')
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            {employee.name}
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            {employee.job_title} • {employee.department}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <Link href={`/vale-transporte/opcao/${employee.id}`} className="btn btn-primary">
            <Bus size={16} />
            Gerar Termo VT
          </Link>
          <Link href={`/medidas-disciplinares/nova?employee=${employee.id}`} className="btn btn-danger">
            <AlertTriangle size={16} />
            Aplicar Medida
          </Link>
        </div>
      </div>

      <div className="tabs-list">
        <button 
          className={`tab-btn ${activeTab === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveTab('dados')}
        >
          <User size={16} />
          Dados Cadastrais
        </button>
        <button 
          className={`tab-btn ${activeTab === 'vt' ? 'active' : ''}`}
          onClick={() => setActiveTab('vt')}
        >
          <Bus size={16} />
          Vale-Transporte
        </button>
        <button 
          className={`tab-btn ${activeTab === 'medidas' ? 'active' : ''}`}
          onClick={() => setActiveTab('medidas')}
        >
          <AlertTriangle size={16} />
          Medidas Disciplinares
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reincidencia' ? 'active' : ''}`}
          onClick={() => setActiveTab('reincidencia')}
        >
          <History size={16} />
          Resumo de Reincidência
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dados' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Informações Pessoais</h3>
              </div>
              <div className="card-body">
                <div className="form-grid form-grid-2">
                  <InfoItem label="Nome de Registro" value={employee.registration_name} />
                  <InfoItem label="CPF" value={maskCpf(employee.cpf)} />
                  <InfoItem label="RG" value={`${employee.rg || ''} ${employee.rg_issuer || ''}`} />
                  <InfoItem label="Data de Nascimento" value={employee.birth_date ? new Date(employee.birth_date).toLocaleDateString('pt-BR') : null} />
                  <InfoItem label="Gênero" value={employee.gender} />
                  <InfoItem label="PIS" value={employee.pis} />
                  <InfoItem label="Estado Civil" value={employee.civil_status} />
                  <InfoItem label="Escolaridade" value={employee.education} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Contrato e Trabalho</h3>
              </div>
              <div className="card-body">
                <div className="form-grid form-grid-2">
                  <InfoItem label="Cargo" value={employee.job_title} />
                  <InfoItem label="Setor" value={employee.department} />
                  <InfoItem label="Data de Admissão" value={employee.admission_date ? new Date(employee.admission_date).toLocaleDateString('pt-BR') : null} />
                  <InfoItem label="Matrícula eSocial" value={employee.esocial_registration} />
                  <InfoItem label="Salário Bruto" value={employee.gross_salary ? `R$ ${employee.gross_salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
                  <InfoItem label="Gestor" value={employee.manager_name} />
                  <InfoItem label="Carga Horária" value={employee.work_schedule} />
                  <InfoItem label="E-mail Login" value={employee.login_email} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Endereço e Contato</h3>
              </div>
              <div className="card-body">
                <div className="form-grid form-grid-2">
                  <InfoItem label="CEP" value={employee.zip_code} />
                  <InfoItem label="Endereço" value={`${employee.address || ''}, ${employee.address_number || ''}`} />
                  <InfoItem label="Bairro" value={employee.neighborhood} />
                  <InfoItem label="Cidade/Estado" value={`${employee.city || ''}/${employee.state || ''}`} />
                  <InfoItem label="E-mail Pessoal" value={employee.email} />
                  <InfoItem label="Telefone" value={employee.phone} />
                  <InfoItem label="Contato Emergência" value={employee.emergency_contact} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Dados Bancários</h3>
              </div>
              <div className="card-body">
                <div className="form-grid form-grid-2">
                  <InfoItem label="Banco" value={employee.bank} />
                  <InfoItem label="Agência" value={employee.agency} />
                  <InfoItem label="Conta" value={employee.account_number} />
                  <InfoItem label="Tipo de Conta" value={employee.account_type} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vt' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Histórico de Vale-Transporte</h3>
              <div className="badge badge-navy">Status Atual: {employee.vt_status}</div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Unidade</th>
                      <th>Valor Mensal</th>
                      <th style={{ textAlign: 'right' }}>Documento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vtRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--brs-gray-400)' }}>
                          Nenhum registro de VT encontrado.
                        </td>
                      </tr>
                    ) : (
                      vtRecords.map(record => (
                        <tr key={record.id}>
                          <td>{new Date(record.generated_at!).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <span className={`badge ${record.type === 'option' ? 'badge-success' : 'badge-danger'}`}>
                              {record.type === 'option' ? 'Opção' : 'Recusa'}
                            </span>
                          </td>
                          <td>{record.unit?.name || '-'}</td>
                          <td>{record.monthly_estimated_total ? `R$ ${record.monthly_estimated_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-ghost btn-sm">
                              <Download size={14} />
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medidas' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Medidas Disciplinares Aplicadas</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data Aplicação</th>
                      <th>Tipo</th>
                      <th>Motivo</th>
                      <th>Reincidência</th>
                      <th style={{ textAlign: 'right' }}>Documento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--brs-gray-400)' }}>
                          Nenhuma medida disciplinar encontrada.
                        </td>
                      </tr>
                    ) : (
                      discRecords.map(record => (
                        <tr key={record.id}>
                          <td>{new Date(record.application_date).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <span className={`badge ${
                              record.type === 'suspension' ? 'badge-danger' : 
                              record.type === 'written_warning' ? 'badge-warning' : 'badge-navy'
                            }`}>
                              {record.type === 'suspension' ? 'Suspensão' : 
                               record.type === 'written_warning' ? 'Escrita' : 'Verbal'}
                            </span>
                          </td>
                          <td>{record.reason?.name}</td>
                          <td>{record.recurrence_number_by_reason}ª vez</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-ghost btn-sm">
                              <Download size={14} />
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reincidencia' && (
          <div className="stat-grid">
            {/* Lógica para agrupar e mostrar reincidências por motivo */}
            <div className="stat-card">
              <div className="stat-icon navy"><AlertTriangle size={20} /></div>
              <div className="stat-value">{discRecords.filter(r => r.type !== 'suspension').length}</div>
              <div className="stat-label">Total Advertências</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger"><AlertTriangle size={20} /></div>
              <div className="stat-value">{discRecords.filter(r => r.type === 'suspension').length}</div>
              <div className="stat-label">Total Suspensões</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div style={{ fontSize: '0.875rem', color: 'var(--brs-gray-800)', fontWeight: 500 }}>
        {value || <span style={{ color: 'var(--brs-gray-200)', fontStyle: 'italic' }}>Não informado</span>}
      </div>
    </div>
  )
}
