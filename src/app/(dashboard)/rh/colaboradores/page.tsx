'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, Search, Download, Upload, Eye, Bus, 
  AlertTriangle, Filter
} from 'lucide-react'
import Link from 'next/link'
import type { Employee } from '@/types'
import { getMyEffectivePermissions } from '@/lib/auth/actions'
import { hasPermission } from '@/lib/auth/permissions'

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export default function ColaboradoresPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [canEditOthers, setCanEditOthers] = useState(false)
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null)
  const [permReady, setPermReady] = useState(false)
  const [permError, setPermError] = useState<string | null>(null)
  
  const supabase = createClient()

  const loadAccessContext = useCallback(async () => {
    try {
      setPermError(null)
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr) throw userErr
      if (!user) {
        setPermError('Usuário não autenticado.')
        setPermReady(true)
        return
      }

      const permsRes = await getMyEffectivePermissions()
      if (!permsRes.success) {
        setPermError('Erro ao carregar permissões.')
        setPermReady(true)
        return
      }

      const perms = (permsRes.permissions || []) as any[]
      const canEdit = hasPermission(perms, 'rh-colaboradores', 'can_edit')

      setCanEditOthers(!!canEdit)

      const { data: userRow } = await supabase
        .from('users')
        .select('employee_id')
        .eq('id', user.id)
        .maybeSingle()

      setMyEmployeeId(userRow?.employee_id ? String(userRow.employee_id) : null)
      setPermReady(true)
    } catch (err) {
      console.error('Erro ao carregar contexto de acesso (RH/Colaboradores):', err)
      setPermError('Erro ao carregar permissões.')
      setPermReady(true)
    }
  }, [supabase])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('employees').select('*')

    if (!permReady) {
      setLoading(false)
      return
    }
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (!canEditOthers) {
      if (!myEmployeeId) {
        setEmployees([])
        setLoading(false)
        return
      }
      query = query.eq('id', myEmployeeId)
    }
    
    const { data, error } = await query.order('name', { ascending: true })
    
    if (!error && data) {
      setEmployees(data as Employee[])
    }
    setLoading(false)
  }, [statusFilter, supabase, permReady, canEditOthers, myEmployeeId])

  useEffect(() => {
    loadAccessContext()
  }, [loadAccessContext])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const departments = useMemo(() => {
    const sets = new Set(employees.map(e => e.department).filter(Boolean))
    return Array.from(sets).sort()
  }, [employees])

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.cpf.includes(searchTerm)
    
    const matchesDept = departmentFilter === 'all' || e.department === departmentFilter
    
    return matchesSearch && matchesDept
  })

  function maskCpf(cpf: string) {
    const clean = cpf.replace(/\D/g, '')
    return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
  }

  return (
    <div className="page-content">
      {permError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {permError}
        </div>
      )}
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
          <button className="btn btn-outline" style={{ background: '#fff' }} disabled={!canEditOthers}>
            <Download size={16} />
            Exportar Lista
          </button>
          <Link
            href="/rh/importacoes"
            className={`btn btn-primary${!canEditOthers ? ' disabled' : ''}`}
            aria-disabled={!canEditOthers}
            tabIndex={!canEditOthers ? -1 : 0}
          >
            <Upload size={16} />
            Importar QuarkRH
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="filters-bar">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="form-control" 
            style={{ width: '150px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="active">Ativos</option>
            <option value="terminated">Desligados</option>
            <option value="all">Todos os Status</option>
          </select>

          <select 
            className="form-control" 
            style={{ width: '200px' }}
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
          >
            <option value="all">Todos os Setores</option>
            {departments.map(dept => (
              <option key={dept} value={dept!}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
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
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <Users size={40} style={{ color: 'var(--brs-gray-200)', marginBottom: '1rem' }} />
                      <h3 style={{ color: 'var(--brs-gray-600)' }}>Nenhum colaborador encontrado</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brs-gray-800)' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>
                        Admissão: {formatDate(emp.admission_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--brs-navy)' }}>{emp.job_title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)', textTransform: 'uppercase' }}>{emp.department}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)', fontFamily: 'monospace' }}>
                      {maskCpf(emp.cpf)}
                    </td>
                    <td>
                      <span className={`badge ${
                        emp.vt_status === 'optante' ? 'badge-success' : 
                        emp.vt_status === 'recusou' ? 'badge-warning' : 'badge-gray'
                      }`}>
                        {emp.vt_status === 'optante' ? 'Optante' : 
                         emp.vt_status === 'recusou' ? 'Recusou' : 'Sem Info'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {emp.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <Link href={`/rh/colaboradores/${emp.id}`} className="btn btn-ghost btn-sm btn-icon" title="Ver Perfil">
                          <Eye size={16} />
                        </Link>
                        {canEditOthers && (
                          <>
                            <Link href={`/rh/vale-transporte/novo/${emp.id}`} className="btn btn-ghost btn-sm btn-icon" title="Vale-Transporte">
                              <Bus size={16} />
                            </Link>
                            <Link href={`/rh/medidas-disciplinares/nova?employee=${emp.id}`} className="btn btn-ghost btn-sm btn-icon" title="Aplicar Medida">
                              <AlertTriangle size={16} />
                            </Link>
                          </>
                        )}
                      </div>
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
