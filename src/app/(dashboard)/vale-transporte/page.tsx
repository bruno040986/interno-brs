'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bus, Search, Plus, Filter, FileText, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ValeTransportePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [empSearch, setEmpSearch] = useState('')
  
  const supabase = createClient()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vt_records')
      .select(`
        *,
        employee:employees(name, cpf),
        unit:company_units(name)
      `)
      .order('option_date', { ascending: false })
    
    if (!error && data) {
      setRecords(data)
    }
    setLoading(false)
  }, [supabase])

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, name, cpf')
      .order('name', { ascending: true })
      .limit(50)
    if (data) setEmployees(data)
  }

  useEffect(() => {
    fetchRecords()
    fetchEmployees()
  }, [fetchRecords])

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(empSearch.toLowerCase()) || 
    e.cpf.includes(empSearch)
  )

  const filteredRecords = records.filter(r => 
    r.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employee?.cpf.includes(searchTerm)
  )

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Gestão de Vale-Transporte
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Histórico de termos de opção e recusa gerados
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Gerar Novo Termo
        </button>
      </div>

      {/* Modal de Seleção de Colaborador */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Selecionar Colaborador</h3>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            <div className="modal-body">
              <div className="search-box" style={{ marginBottom: '1rem' }}>
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou CPF..." 
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredEmployees.map(emp => (
                  <Link 
                    key={emp.id} 
                    href={`/vale-transporte/novo/${emp.id}`}
                    className="sidebar-link"
                    style={{ color: 'var(--brs-gray-800)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.25rem', border: '1px solid var(--brs-gray-100)', display: 'block' }}
                  >
                    <div style={{ fontWeight: 600 }}>{emp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>CPF: {emp.cpf}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="search-box" style={{ flex: 1 }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por colaborador ou CPF..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Tipo</th>
                <th>Data Gerado</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Status</th>
                <th>Unidade</th>
                <th>Custo Empresa</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <Bus size={40} style={{ color: 'var(--brs-gray-200)', marginBottom: '1rem' }} />
                      <h3 style={{ color: 'var(--brs-gray-600)' }}>Nenhum registro encontrado</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{record.employee?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>CPF: {record.employee?.cpf}</div>
                    </td>
                    <td>
                      <span className={`badge ${record.type === 'option' ? 'badge-success' : 'badge-warning'}`}>
                        {record.type === 'option' ? 'Opção' : 'Recusa'}
                      </span>
                    </td>
                    <td>{format(new Date(record.generated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                    <td>{record.effective_date ? format(new Date(record.effective_date + 'T12:00:00'), "dd/MM/yyyy") : '-'}</td>
                    <td>{record.end_date ? format(new Date(record.end_date + 'T12:00:00'), "dd/MM/yyyy") : '-'}</td>
                    <td>
                      <span className={`badge ${!record.end_date ? 'badge-navy' : 'badge-gray'}`}>
                        {!record.end_date ? 'Vigente' : 'Histórico'}
                      </span>
                    </td>
                    <td>{record.unit?.name || '-'}</td>
                    <td>{record.type === 'option' ? `R$ ${record.company_estimated_cost?.toFixed(2)}` : '-'}</td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/vale-transporte/visualizar/${record.id}`} className="btn btn-ghost btn-sm">
                        Visualizar
                        <ChevronRight size={14} />
                      </Link>
                      <button 
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.')) return
                          
                          // Verificar se é o último registro do colaborador
                          const { data: latest } = await supabase
                            .from('vt_records')
                            .select('id')
                            .eq('employee_id', record.employee_id)
                            .order('option_date', { ascending: false })
                            .limit(1)
                            .single()
                          
                          if (latest?.id !== record.id) {
                            alert('Somente o último registro gerado para este colaborador pode ser excluído para manter a integridade do histórico.')
                            return
                          }

                          const { error } = await supabase.from('vt_records').delete().eq('id', record.id)
                          
                          if (!error) {
                            // Buscar o termo anterior para restaurar o status do colaborador
                            const { data: prev } = await supabase
                              .from('vt_records')
                              .select('type')
                              .eq('employee_id', record.employee_id)
                              .order('option_date', { ascending: false })
                              .limit(1)
                              .single()
                            
                            const newStatus = prev ? (prev.type === 'option' ? 'optante' : 'recusou') : 'pendente'
                            await supabase.from('employees').update({ vt_status: newStatus }).eq('id', record.employee_id)
                            
                            fetchRecords()
                          } else {
                            alert('Erro ao excluir: ' + error.message)
                          }
                        }}
                        className="btn btn-ghost btn-sm text-danger"
                      >
                        <Trash2 size={14} />
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
  )
}
