'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Search, Plus, FileText, ChevronRight, Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function MedidasDisciplinaresPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const supabase = createClient()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('disciplinary_records')
      .select(`
        *,
        employee:employees(name, cpf),
        reason:disciplinary_reasons(name)
      `)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setRecords(data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const translateType = (type: string) => {
    switch (type) {
      case 'verbal_warning': return 'Advertência Verbal'
      case 'written_warning': return 'Advertência Escrita'
      case 'suspension': return 'Suspensão Disciplinar'
      default: return type
    }
  }

  const filteredRecords = records.filter(r => 
    r.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employee?.cpf.includes(searchTerm)
  )

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Medidas Disciplinares
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Controle de advertências e suspensões aplicadas
          </p>
        </div>
        <Link href="/medidas-disciplinares/nova" className="btn btn-primary">
          <Plus size={16} />
          Nova Medida
        </Link>
      </div>

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
                <th>Motivo</th>
                <th>Data Ocorrência</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <AlertTriangle size={40} style={{ color: 'var(--brs-gray-200)', marginBottom: '1rem' }} />
                      <h3 style={{ color: 'var(--brs-gray-600)' }}>Nenhuma medida disciplinar registrada</h3>
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
                      <span className={`badge ${
                        record.type === 'suspension' ? 'badge-danger' : 
                        record.type === 'verbal_warning' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {translateType(record.type)}
                      </span>
                    </td>
                    <td>{record.reason?.name}</td>
                    <td>{format(new Date(record.occurrence_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td>
                      <span className={`badge ${record.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                        {record.status === 'active' ? 'Ativa' : 'Cancelada'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/colaboradores/${record.employee_id}`} className="btn btn-ghost btn-sm">
                        Ver Perfil
                        <ChevronRight size={14} />
                      </Link>
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
