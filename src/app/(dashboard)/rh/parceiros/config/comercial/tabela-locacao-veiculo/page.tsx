'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import {
  deleteCommercialVehicleRentalRate,
  getCommercialVehicleRentalRates,
  saveCommercialVehicleRentalRate,
} from '../../../actions'

type RateRow = {
  id?: string
  vehicle_type: 'carro' | 'moto'
  condition_name: string
  validity_start: string
  validity_end?: string | null
  monthly_value: string | number
}

type RateSource = Partial<RateRow> & {
  id?: string
}

const EMPTY_RATE: RateRow = {
  vehicle_type: 'carro',
  condition_name: 'Ate 5 anos de fabricacao',
  validity_start: '',
  validity_end: '',
  monthly_value: '',
}

function normalizeRate(row: RateSource): RateRow {
  return {
    id: row?.id,
    vehicle_type: row?.vehicle_type || 'carro',
    condition_name: row?.condition_name || 'Ate 5 anos de fabricacao',
    validity_start: row?.validity_start || '',
    validity_end: row?.validity_end || '',
    monthly_value: row?.monthly_value ?? '',
  }
}

export default function VehicleRentalTablePage() {
  const [rates, setRates] = useState<RateRow[]>([])
  const [draft, setDraft] = useState<RateRow>(EMPTY_RATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function loadData() {
    setLoading(true)
    const res = await getCommercialVehicleRentalRates()
    if (res.success) {
      setRates((res.rates || []).map(normalizeRate))
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao carregar tabela de locacao.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!alive) return
      await loadData()
    })()
    return () => {
      alive = false
    }
  }, [])

  async function handleSave() {
    if (!draft.validity_start || !draft.condition_name || !draft.monthly_value) {
      setMessage({ type: 'error', text: 'Preencha vigencia inicial, condicao e valor mensal.' })
      return
    }
    setSaving(true)
    setMessage(null)
    const res = await saveCommercialVehicleRentalRate(draft)
    if (res.success) {
      setMessage({ type: 'success', text: 'Regra salva com sucesso.' })
      setDraft(EMPTY_RATE)
      await loadData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao salvar regra.' })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir esta regra?')) return
    const res = await deleteCommercialVehicleRentalRate(id)
    if (res.success) {
      setMessage({ type: 'success', text: 'Regra removida.' })
      await loadData()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao remover regra.' })
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--brs-gray-800)' }}>Tabela de Locacao de Veiculo</h1>
          <p style={{ margin: '0.3rem 0 0', color: 'var(--brs-gray-400)', fontSize: '0.875rem' }}>
            Base de apoio para a aba de aluguel de veiculo na estrutura comercial.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
          Salvar regra
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 8,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div className="form-grid form-grid-4">
          <div className="form-group">
            <label className="form-label">Tipo de Veiculo</label>
            <select className="form-control" value={draft.vehicle_type} onChange={(e) => setDraft((prev) => ({ ...prev, vehicle_type: e.target.value as 'carro' | 'moto' }))}>
              <option value="carro">Carro</option>
              <option value="moto">Moto</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Condicao</label>
            <select className="form-control" value={draft.condition_name} onChange={(e) => setDraft((prev) => ({ ...prev, condition_name: e.target.value }))}>
              <option value="Ate 5 anos de fabricacao">Ate 5 anos de fabricacao</option>
              <option value="De mais de 5 anos ate 10 anos de fabricacao">De mais de 5 anos ate 10 anos de fabricacao</option>
              <option value="Mais de 10 anos de fabricacao">Mais de 10 anos de fabricacao</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Vigencia Inicial</label>
            <input type="date" className="form-control" value={draft.validity_start} onChange={(e) => setDraft((prev) => ({ ...prev, validity_start: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Valor Mensal</label>
            <input className="form-control" value={String(draft.monthly_value || '')} onChange={(e) => setDraft((prev) => ({ ...prev, monthly_value: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
          <button type="button" className="btn btn-outline" onClick={handleSave} disabled={saving}>
            <Plus size={16} />
            Adicionar regra
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Condicao</th>
                <th>Vigencia Inicial</th>
                <th>Vigencia Final</th>
                <th>Valor Mensal</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center' }}>
                    <Loader2 size={18} className="spinner" />
                  </td>
                </tr>
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '1rem', color: 'var(--brs-gray-500)' }}>
                    Nenhuma regra cadastrada.
                  </td>
                </tr>
              ) : (
                rates.map((row) => (
                  <tr key={row.id}>
                    <td>{row.vehicle_type === 'carro' ? 'Carro' : 'Moto'}</td>
                    <td>{row.condition_name}</td>
                    <td>{row.validity_start || '-'}</td>
                    <td>{row.validity_end || 'Em aberto'}</td>
                    <td>{row.monthly_value || '-'}</td>
                    <td>
                      <button type="button" className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => row.id && handleDelete(row.id)}>
                        <Trash2 size={16} />
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
