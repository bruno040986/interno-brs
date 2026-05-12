'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Bus, ChevronLeft, Plus, Trash2, Save, Loader2, 
  User, MapPin, Calculator, FileText, AlertCircle
} from 'lucide-react'
import type { Employee, CompanyUnit } from '@/types'

interface Route {
  type: 'ida' | 'volta'
  line: string
  value: number
}

export default function VTOpcaoPage() {
  const { id } = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [units, setUnits] = useState<CompanyUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [selectedUnit, setSelectedUnit] = useState('')
  const [routes, setRoutes] = useState<Route[]>([
    { type: 'ida', line: '', value: 0 },
    { type: 'volta', line: '', value: 0 }
  ])
  const [workingDays, setWorkingDays] = useState(22)
  
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    
    const [empRes, unitRes] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).single(),
      supabase.from('company_units').select('*').eq('active', true).order('name', { ascending: true })
    ])
    
    if (empRes.data) {
      setEmployee(empRes.data as Employee)
      // Tentar pré-selecionar unidade se houver uma correspondência simples ou apenas uma ativa
      if (unitRes.data && unitRes.data.length === 1) setSelectedUnit(unitRes.data[0].id)
    }
    if (unitRes.data) setUnits(unitRes.data as CompanyUnit[])
    
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totals = useMemo(() => {
    const daily = routes.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
    const monthly = daily * workingDays
    const salary = employee?.gross_salary || 0
    const discount = salary * 0.06
    const companyCost = Math.max(0, monthly - discount)
    
    return { daily, monthly, discount, companyCost }
  }, [routes, workingDays, employee])

  function addRoute() {
    setRoutes([...routes, { type: 'ida', line: '', value: 0 }])
  }

  function removeRoute(index: number) {
    setRoutes(routes.filter((_, i) => i !== index))
  }

  function updateRoute(index: number, field: keyof Route, value: any) {
    const newRoutes = [...routes]
    newRoutes[index] = { ...newRoutes[index], [field]: value }
    setRoutes(newRoutes)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employee || !selectedUnit) return
    
    setSaving(true)
    
    // 1. Criar registro de VT
    const { data: vtRecord, error: vtError } = await supabase
      .from('vt_records')
      .insert([{
        employee_id: employee.id,
        type: 'option',
        unit_id: selectedUnit,
        daily_total: totals.daily,
        working_days_estimate: workingDays,
        monthly_estimated_total: totals.monthly,
        max_employee_discount: totals.discount,
        company_estimated_cost: totals.companyCost,
        status: 'active'
      }])
      .select()
      .single()
      
    if (!vtError && vtRecord) {
      // 2. Criar trechos
      const routeRecords = routes.map(r => ({
        vt_record_id: vtRecord.id,
        route_type: r.type,
        line_operator: r.line,
        unit_value: r.value
      }))
      
      await supabase.from('vt_routes').insert(routeRecords)
      
      // 3. Atualizar status do colaborador
      await supabase
        .from('employees')
        .update({ vt_status: 'optante' })
        .eq('id', employee.id)
        
      // 4. Auditoria
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'generate_vt_option',
        entity_type: 'vt_records',
        entity_id: vtRecord.id,
        description: `Termo de opção gerado para ${employee.name}`
      })
      
      router.push(`/colaboradores/${employee.id}`)
    }
    
    setSaving(false)
  }

  if (loading) return <div className="page-content text-center">Carregando...</div>

  return (
    <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
            Opção pelo Vale-Transporte
          </h1>
          <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Preencha os dados de transporte para gerar o termo oficial
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Colaborador info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><User size={16} /> Dados do Colaborador</h3>
              </div>
              <div className="card-body">
                <div className="form-grid form-grid-2">
                  <div>
                    <label className="form-label">Nome</label>
                    <div style={{ fontWeight: 600 }}>{employee?.name}</div>
                  </div>
                  <div>
                    <label className="form-label">CPF</label>
                    <div style={{ fontWeight: 600 }}>{employee?.cpf}</div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label">Endereço Residencial</label>
                  <div style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>
                    {employee?.address}, {employee?.address_number} {employee?.complement}<br />
                    {employee?.neighborhood} — {employee?.city}/{employee?.state} — CEP: {employee?.zip_code}
                  </div>
                </div>
              </div>
            </div>

            {/* Unidade info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><MapPin size={16} /> Unidade de Trabalho</h3>
              </div>
              <div className="card-body">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Selecione a Unidade <span className="required">*</span></label>
                  <select 
                    className="form-control" 
                    required 
                    value={selectedUnit}
                    onChange={e => setSelectedUnit(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  {selectedUnit && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--brs-gray-400)', padding: '0.5rem', background: 'var(--brs-gray-50)', borderRadius: 6 }}>
                      {units.find(u => u.id === selectedUnit)?.address}, {units.find(u => u.id === selectedUnit)?.number} - {units.find(u => u.id === selectedUnit)?.city}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trechos info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><Bus size={16} /> Trechos de Transporte</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={addRoute}>
                  <Plus size={14} /> Adicionar Trecho
                </button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '100px' }}>Tipo</th>
                        <th>Linha / Operadora</th>
                        <th style={{ width: '120px' }}>Valor Unit.</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((route, idx) => (
                        <tr key={idx}>
                          <td>
                            <select 
                              className="form-control" 
                              value={route.type}
                              onChange={e => updateRoute(idx, 'type', e.target.value)}
                            >
                              <option value="ida">Ida</option>
                              <option value="volta">Volta</option>
                            </select>
                          </td>
                          <td>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="Ex: 600 - Gama/Valparaiso"
                              value={route.line}
                              onChange={e => updateRoute(idx, 'line', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              step="0.01" 
                              className="form-control" 
                              placeholder="0,00"
                              value={route.value}
                              onChange={e => updateRoute(idx, 'value', e.target.value)}
                            />
                          </td>
                          <td>
                            <button type="button" className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => removeRoute(idx)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '1.5rem' }}>
            {/* Resumo de Cálculos */}
            <div className="card" style={{ border: '1px solid var(--brs-navy)', background: 'rgba(27,58,107,0.02)' }}>
              <div className="card-header" style={{ background: 'var(--brs-navy)', color: '#fff' }}>
                <h3 className="card-title" style={{ color: '#fff' }}><Calculator size={16} /> Resumo Financeiro</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Dias úteis estimados (mês)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={workingDays}
                    onChange={e => setWorkingDays(Number(e.target.value))}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <SummaryRow label="Total Diário" value={totals.daily} />
                  <SummaryRow label="Total Mensal (Estimado)" value={totals.monthly} />
                  <div style={{ height: '1px', background: 'var(--brs-gray-200)', margin: '0.25rem 0' }} />
                  <SummaryRow label="Desconto 6% (Máximo)" value={totals.discount} color="var(--brs-danger)" />
                  <div style={{ padding: '0.75rem', background: 'var(--brs-navy)', borderRadius: 8, marginTop: '0.5rem', color: '#fff' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>Custeio Empresa (Líquido)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>R$ {totals.companyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--brs-gray-600)', marginBottom: '1.25rem' }}>
                  <AlertCircle size={16} className="text-info" style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0 }}>Ao salvar, um documento PDF será gerado e vinculado ao histórico do colaborador. O status de VT será atualizado para <strong>Optante</strong>.</p>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={saving || !selectedUnit}
                >
                  {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
                  {saving ? 'Gerando Documento...' : 'Salvar e Gerar Termo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function SummaryRow({ label, value, color }: { label: string, value: number, color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--brs-gray-600)' }}>{label}</span>
      <span style={{ fontSize: '1rem', fontWeight: 700, color: color || 'var(--brs-gray-800)' }}>
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    </div>
  )
}
