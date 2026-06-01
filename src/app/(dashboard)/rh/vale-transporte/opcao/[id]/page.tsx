'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Save, Loader2 } from 'lucide-react'
import type { Employee, CompanyUnit } from '@/types'
import { createVtRecord } from '../../../server-actions'

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
  const [selectedUnit, setSelectedUnit] = useState('')
  const [routes, setRoutes] = useState<Route[]>([
    { type: 'ida', line: '', value: 0 },
    { type: 'volta', line: '', value: 0 },
  ])
  const [workingDays, setWorkingDays] = useState(22)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)

    const [empRes, unitRes] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).single(),
      supabase.from('company_units').select('*').eq('active', true).order('name', { ascending: true }),
    ])

    if (empRes.data) setEmployee(empRes.data as Employee)
    if (unitRes.data) setUnits(unitRes.data as CompanyUnit[])
    if (unitRes.data && unitRes.data.length === 1) setSelectedUnit(unitRes.data[0].id)
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

  function updateRoute(index: number, field: keyof Route, value: string | number) {
    const newRoutes = [...routes]
    newRoutes[index] = { ...newRoutes[index], [field]: value }
    setRoutes(newRoutes)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employee || !selectedUnit) return

    setSaving(true)
    try {
      await createVtRecord({
        employeeId: employee.id,
        mode: 'option',
        optionDate: new Date().toISOString().slice(0, 10),
        selectedUnit,
        routes,
        workingDays,
        dailyTotal: totals.daily,
        monthlyTotal: totals.monthly,
        maxDiscount: totals.discount,
        companyCost: totals.companyCost,
      })
      router.push(`/colaboradores/${employee.id}`)
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar o documento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-content text-center">Carregando...</div>

  return (
    <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ margin: 0 }}>Opcao pelo Vale-Transporte</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ marginTop: 0 }}><strong>Colaborador:</strong> {employee?.name}</p>
            <label className="form-label">Unidade</label>
            <select className="form-control" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} required>
              <option value="">Selecione...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <label className="form-label">Dias uteis</label>
            <input type="number" className="form-control" value={workingDays} onChange={(e) => setWorkingDays(Number(e.target.value || 0))} />
            {routes.map((route, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 140px', gap: '0.5rem', marginTop: '0.5rem' }}>
                <select className="form-control" value={route.type} onChange={(e) => updateRoute(idx, 'type', e.target.value as Route['type'])}>
                  <option value="ida">Ida</option>
                  <option value="volta">Volta</option>
                </select>
                <input className="form-control" value={route.line} onChange={(e) => updateRoute(idx, 'line', e.target.value)} placeholder="Linha / operadora" />
                <input className="form-control" type="number" step="0.01" value={route.value} onChange={(e) => updateRoute(idx, 'value', Number(e.target.value || 0))} />
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ margin: 0 }}>Total diario: R$ {totals.daily.toFixed(2)}</p>
            <p style={{ margin: 0 }}>Total mensal: R$ {totals.monthly.toFixed(2)}</p>
            <p style={{ margin: 0 }}>Desconto maximo (6%): R$ {totals.discount.toFixed(2)}</p>
            <p style={{ margin: 0 }}>Custeio empresa: R$ {totals.companyCost.toFixed(2)}</p>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving || !selectedUnit}>
          {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />} Salvar
        </button>
      </form>
    </div>
  )
}
