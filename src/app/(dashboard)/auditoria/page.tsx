'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, User, Calendar, Info, Clock, Search } from 'lucide-react'
import type { AuditLog } from '@/types'

const PAGE_SIZE = 20

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('audit_logs')
      .select('*, user:users(name, email)', { count: 'exact' })
      
    if (search) {
      query = query.ilike('description', `%${search}%`)
    }
    
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
      
    if (!error && data) {
      setLogs(data as any[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [page, search, supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="page-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
          Auditoria do Sistema
        </h1>
        <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Rastreabilidade de todas as ações sensíveis realizadas por usuários
        </p>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: '1rem' }}>
          <div className="filters-bar">
            <div className="search-input" style={{ maxWidth: 400 }}>
              <Search />
              <input 
                type="text" 
                placeholder="Buscar em descrições..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Descrição</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ borderTopColor: 'var(--brs-navy)' }} /></td></tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="empty-state"><ClipboardList /><h3>Nenhum log encontrado</h3></div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--brs-gray-600)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={12} />
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{(log as any).user?.name || 'Sistema'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{(log as any).user?.email}</div>
                      </td>
                      <td>
                        <span className="badge badge-navy">{log.action}</span>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{log.description}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>{log.ip_address || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">Página {page} de {totalPages} ({totalCount} logs)</div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
                <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
