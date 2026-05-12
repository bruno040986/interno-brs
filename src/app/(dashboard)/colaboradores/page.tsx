'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, Filter, UserPlus, Eye, Bus, AlertTriangle, 
  ChevronLeft, ChevronRight, MoreHorizontal, Download
} from 'lucide-react'
import Link from 'next/link'
import type { Employee } from '@/types'

const PAGE_SIZE = 10

export default function ColaboradoresPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [departments, setDepartments] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  const supabase = createClient()

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      
    if (search) {
      if (/^\d+$/.test(search.replace(/\D/g, ''))) {
        query = query.ilike('cpf', `%${search.replace(/\D/g, '')}%`)
      } else {
        query = query.ilike('name', `%${search}%`)
      }
    }
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }
    
    if (departmentFilter !== 'all') {
      query = query.eq('department', departmentFilter)
    }
    
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    
    const { data, count, error } = await query
      .order('name', { ascending: true })
      .range(from, to)
      
    if (!error && data) {
      setEmployees(data as Employee[])
      setTotalCount(count || 0)
    }
    
    setLoading(false)
  }, [search, statusFilter, departmentFilter, page, supabase])

  const fetchDepartments = useCallback(async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('department')
      .not('department', 'is', null)
    
    if (!error && data) {
      const uniqueDeps = Array.from(new Set(data.map(d => d.department))).filter(Boolean) as string[]
      setDepartments(uniqueDeps.sort())
    }
  }, [supabase])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  function maskCpf(cpf: string) {
    const clean = cpf.replace(/\D/g, '')
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Colaboradores
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Gerencie o cadastro e visualize o histórico funcional
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline">
            <Download size={16} />
            Exportar Lista
          </button>
          <Link href="/importacoes" className="btn btn-primary">
            <Upload size={16} />
            Importar QuarkRH
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: '1rem' }}>
          <div className="filters-bar">
            <div className="search-input" style={{ maxWidth: 400 }}>
              <Search />
              <input 
                type="text" 
                placeholder="Buscar por nome ou CPF..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            
            <select 
              className="form-control" 
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="terminated">Desligados</option>
              <option value="inactive">Inativos</option>
            </select>

            <select 
              className="form-control" 
              style={{ width: 'auto' }}
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            >
              <option value="all">Todos os Setores</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Cargo / Setor</th>
                  <th>CPF</th>
                  <th>Status VT</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                      <span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} />
                      <p style={{ marginTop: '0.5rem', color: 'var(--brs-gray-400)' }}>Carregando colaboradores...</p>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="empty-state">
                        <Users />
                        <h3>Nenhum colaborador encontrado</h3>
                        <p>Tente ajustar os filtros ou realizar uma nova importação.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>
                          Admissão: {emp.admission_date ? new Date(emp.admission_date).toLocaleDateString('pt-BR') : '-'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>{emp.job_title || '-'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{emp.department || '-'}</div>
                      </td>
                      <td className="cpf-masked">{maskCpf(emp.cpf)}</td>
                      <td>
                        <span className={`badge ${
                          emp.vt_status === 'optante' ? 'badge-success' : 
                          emp.vt_status === 'recusou' ? 'badge-danger' : 
                          emp.vt_status === 'sem_informacao' ? 'badge-gray' : 'badge-info'
                        }`}>
                          {emp.vt_status === 'sem_informacao' ? 'Sem Info' : 
                           emp.vt_status === 'optante' ? 'Optante' : 
                           emp.vt_status === 'recusou' ? 'Recusou' : emp.vt_status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          emp.status === 'active' ? 'badge-success' : 
                          emp.status === 'terminated' ? 'badge-danger' : 'badge-gray'
                        }`}>
                          {emp.status === 'active' ? 'Ativo' : 
                           emp.status === 'terminated' ? 'Desligado' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link href={`/colaboradores/${emp.id}`} className="btn btn-ghost btn-sm btn-icon" title="Ver Perfil">
                            <Eye size={16} />
                          </Link>
                          <Link href={`/vale-transporte/opcao/${emp.id}`} className="btn btn-ghost btn-sm btn-icon" title="Gerar VT">
                            <Bus size={16} />
                          </Link>
                          <Link href={`/medidas-disciplinares/nova?employee=${emp.id}`} className="btn btn-ghost btn-sm btn-icon" title="Nova Advertência">
                            <AlertTriangle size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Mostrando <strong>{(page - 1) * PAGE_SIZE + 1}</strong> a <strong>{Math.min(page * PAGE_SIZE, totalCount)}</strong> de <strong>{totalCount}</strong> colaboradores
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button 
                  className="btn btn-outline btn-sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Upload(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
