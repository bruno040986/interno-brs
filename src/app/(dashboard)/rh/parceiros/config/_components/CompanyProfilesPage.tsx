'use client'

import { useEffect, useMemo, useState } from 'react'
import { archiveCompanyProfile, getCompanyProfiles, saveCompanyProfile } from '../../actions'
import { AlertCircle, Building2, CheckCircle, Loader2, Plus, Save } from 'lucide-react'

type PersonData = {
  cpf?: string
  name?: string
  birth_date?: string
  cep?: string
  address_state?: string
  address_city?: string
  address_neighborhood?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  whatsapp?: string
  email_professional?: string
  email_signature?: string
}

type CompanyData = {
  name?: string
  fantasy_name?: string
  opening_date?: string
  registration_status?: string
  size?: string
  capital_social?: string
  legal_nature?: string
  country?: string
  address_state?: string
  address_city?: string
  cep?: string
  address_neighborhood?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  email_principal?: string
  email_support?: string
  phone_principal?: string
  bank_name?: string
  bank_agency?: string
  bank_account?: string
  pix_type?: 'cnpj' | 'bank' | 'email' | 'phone' | 'random'
  pix_key?: string
  latitude?: string
  longitude?: string
  site?: string
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
  whatsapp_support?: string
  whatsapp_community?: string
  linkedin?: string
  cnpjws_payload?: any
}

type CompanyProfileRow = {
  id?: string
  nickname: string
  is_active: boolean
  cnpj?: string | null
  company_data?: CompanyData
  partner_primary_data?: PersonData
  partner_secondary_data?: PersonData
  witness_data?: PersonData
}

const EMPTY_PERSON: PersonData = {
  cpf: '',
  name: '',
  birth_date: '',
  cep: '',
  address_state: '',
  address_city: '',
  address_neighborhood: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  whatsapp: '',
  email_professional: '',
  email_signature: '',
}

const EMPTY_PROFILE: CompanyProfileRow = {
  nickname: '',
  is_active: true,
  cnpj: '',
  company_data: {
    name: '',
    fantasy_name: '',
    opening_date: '',
    registration_status: '',
    size: '',
    capital_social: '',
    legal_nature: '',
    country: '',
    address_state: '',
    address_city: '',
    cep: '',
    address_neighborhood: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    email_principal: '',
    email_support: '',
    phone_principal: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    pix_type: 'cnpj',
    pix_key: '',
    latitude: '',
    longitude: '',
    site: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    whatsapp_support: '',
    whatsapp_community: '',
    linkedin: '',
    cnpjws_payload: {},
  },
  partner_primary_data: { ...EMPTY_PERSON },
  partner_secondary_data: { ...EMPTY_PERSON },
  witness_data: { ...EMPTY_PERSON },
}

function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '')
}

function maskCnpj(value: string) {
  const v = onlyDigits(value).slice(0, 14)
  return v
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function maskCpf(value: string) {
  const v = onlyDigits(value).slice(0, 11)
  return v
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function maskCep(value: string) {
  const v = onlyDigits(value).slice(0, 8)
  return v.replace(/^(\d{5})(\d)/, '$1-$2')
}

function maskPhone(value: string) {
  const v = onlyDigits(value).slice(0, 11)
  if (v.length <= 10) return v.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return v.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

function normalizeProfile(raw: any): CompanyProfileRow {
  return {
    id: raw?.id,
    nickname: String(raw?.nickname || ''),
    is_active: raw?.is_active !== false,
    cnpj: String(raw?.cnpj || ''),
    company_data: { ...EMPTY_PROFILE.company_data, ...(raw?.company_data || {}) },
    partner_primary_data: { ...EMPTY_PERSON, ...(raw?.partner_primary_data || {}) },
    partner_secondary_data: { ...EMPTY_PERSON, ...(raw?.partner_secondary_data || {}) },
    witness_data: { ...EMPTY_PERSON, ...(raw?.witness_data || {}) },
  }
}

function PersonSection({
  title,
  value,
  setValue,
  loadingCpf,
  loadingCep,
  onFetchCpf,
  onFetchCep,
}: {
  title: string
  value: PersonData
  setValue: (next: PersonData) => void
  loadingCpf: boolean
  loadingCep: boolean
  onFetchCpf: () => Promise<void>
  onFetchCep: () => Promise<void>
}) {
  return (
    <div className="card" style={{ padding: '0.9rem', border: '1px solid var(--brs-gray-100)' }}>
      <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>{title}</div>
      <div className="form-grid form-grid-3">
        <div className="form-group">
          <label className="form-label">CPF</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="form-control" value={maskCpf(value.cpf || '')} onChange={(e) => setValue({ ...value, cpf: onlyDigits(e.target.value) })} />
            <button type="button" className="btn btn-outline" onClick={onFetchCpf} disabled={loadingCpf}>
              {loadingCpf ? <Loader2 size={16} className="spinner" /> : 'Buscar'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Nome Completo</label>
          <input className="form-control" value={value.name || ''} onChange={(e) => setValue({ ...value, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Data de Nascimento</label>
          <input type="date" className="form-control" value={value.birth_date || ''} onChange={(e) => setValue({ ...value, birth_date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">CEP</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="form-control" value={maskCep(value.cep || '')} onChange={(e) => setValue({ ...value, cep: onlyDigits(e.target.value) })} />
            <button type="button" className="btn btn-outline" onClick={onFetchCep} disabled={loadingCep}>
              {loadingCep ? <Loader2 size={16} className="spinner" /> : 'Buscar'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">UF</label>
          <input className="form-control" value={value.address_state || ''} onChange={(e) => setValue({ ...value, address_state: e.target.value.toUpperCase().slice(0, 2) })} />
        </div>
        <div className="form-group">
          <label className="form-label">Cidade</label>
          <input className="form-control" value={value.address_city || ''} onChange={(e) => setValue({ ...value, address_city: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Bairro</label>
          <input className="form-control" value={value.address_neighborhood || ''} onChange={(e) => setValue({ ...value, address_neighborhood: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Logradouro</label>
          <input className="form-control" value={value.address_street || ''} onChange={(e) => setValue({ ...value, address_street: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Número</label>
          <input className="form-control" value={value.address_number || ''} onChange={(e) => setValue({ ...value, address_number: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Complemento</label>
          <input className="form-control" value={value.address_complement || ''} onChange={(e) => setValue({ ...value, address_complement: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">WhatsApp</label>
          <input className="form-control" value={maskPhone(value.whatsapp || '')} onChange={(e) => setValue({ ...value, whatsapp: onlyDigits(e.target.value) })} />
        </div>
        <div className="form-group">
          <label className="form-label">E-mail Profissional</label>
          <input type="email" className="form-control" value={value.email_professional || ''} onChange={(e) => setValue({ ...value, email_professional: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">E-mail Pessoal (Assinatura)</label>
          <input type="email" className="form-control" value={value.email_signature || ''} onChange={(e) => setValue({ ...value, email_signature: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

export default function CompanyProfilesPage() {
  const [items, setItems] = useState<CompanyProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState<Record<string, boolean>>({})
  const [view, setView] = useState<'list' | 'edit'>('list')
  const [selected, setSelected] = useState<CompanyProfileRow | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const res = await getCompanyProfiles()
      if (res.success) {
        const rows = ((res.companies as any[]) || []).map(normalizeProfile)
        setItems(rows)
      } else {
        setMessage({ type: 'error', text: res.error || 'Erro ao carregar cadastro de empresas.' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao carregar cadastro de empresas.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const canSave = useMemo(() => {
    return !!selected?.nickname?.trim()
  }, [selected?.nickname])

  async function fillCompanyByCnpj() {
    if (!selected) return
    const cnpj = onlyDigits(selected.cnpj || '')
    if (cnpj.length !== 14) return setMessage({ type: 'error', text: 'Informe um CNPJ válido para busca.' })
    setSearching((prev) => ({ ...prev, cnpj: true }))
    setMessage(null)
    try {
      const res = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`)
      if (!res.ok) throw new Error('CNPJ não encontrado.')
      const data = await res.json()
      const est = data?.estabelecimento || {}
      const ddd = String(est?.ddd1 || '')
      const tel = String(est?.telefone1 || '')
      setSelected((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          company_data: {
            ...(prev.company_data || {}),
            name: data?.razao_social || prev.company_data?.name || '',
            fantasy_name: est?.nome_fantasia || prev.company_data?.fantasy_name || '',
            opening_date: est?.data_inicio_atividade || prev.company_data?.opening_date || '',
            registration_status: est?.situacao_cadastral || prev.company_data?.registration_status || '',
            size: data?.porte?.descricao || prev.company_data?.size || '',
            capital_social: data?.capital_social ? String(data.capital_social) : prev.company_data?.capital_social || '',
            legal_nature: data?.natureza_juridica?.descricao || prev.company_data?.legal_nature || '',
            country: est?.pais?.nome || prev.company_data?.country || '',
            address_state: est?.estado?.sigla || prev.company_data?.address_state || '',
            address_city: est?.cidade?.nome || prev.company_data?.address_city || '',
            cep: est?.cep || prev.company_data?.cep || '',
            address_neighborhood: est?.bairro || prev.company_data?.address_neighborhood || '',
            address_street: est?.logradouro || prev.company_data?.address_street || '',
            address_number: est?.numero || prev.company_data?.address_number || '',
            address_complement: est?.complemento || prev.company_data?.address_complement || '',
            phone_principal: `${ddd}${tel}` || prev.company_data?.phone_principal || '',
            cnpjws_payload: data,
          },
        }
      })
      setMessage({ type: 'success', text: 'Dados da empresa preenchidos via CNPJ.WS.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao consultar CNPJ.' })
    } finally {
      setSearching((prev) => ({ ...prev, cnpj: false }))
    }
  }

  async function fillAddressByCep(target: 'company' | 'primary' | 'secondary' | 'witness') {
    if (!selected) return
    const sourceCep =
      target === 'company'
        ? selected.company_data?.cep
        : target === 'primary'
          ? selected.partner_primary_data?.cep
          : target === 'secondary'
            ? selected.partner_secondary_data?.cep
            : selected.witness_data?.cep
    const cep = onlyDigits(sourceCep || '')
    if (cep.length !== 8) return setMessage({ type: 'error', text: 'Informe um CEP válido para busca.' })
    setSearching((prev) => ({ ...prev, [`cep_${target}`]: true }))
    setMessage(null)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
      if (!res.ok) throw new Error('CEP não encontrado.')
      const data = await res.json()
      setSelected((prev) => {
        if (!prev) return prev
        if (target === 'company') {
          return {
            ...prev,
            company_data: {
              ...(prev.company_data || {}),
              cep,
              address_street: data.street || prev.company_data?.address_street || '',
              address_neighborhood: data.neighborhood || prev.company_data?.address_neighborhood || '',
              address_city: data.city || prev.company_data?.address_city || '',
              address_state: data.state || prev.company_data?.address_state || '',
            },
          }
        }
        const sectionKey =
          target === 'primary' ? 'partner_primary_data' : target === 'secondary' ? 'partner_secondary_data' : 'witness_data'
        const current = (prev as any)[sectionKey] || {}
        return {
          ...prev,
          [sectionKey]: {
            ...current,
            cep,
            address_street: data.street || current.address_street || '',
            address_neighborhood: data.neighborhood || current.address_neighborhood || '',
            address_city: data.city || current.address_city || '',
            address_state: data.state || current.address_state || '',
          },
        }
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao consultar CEP.' })
    } finally {
      setSearching((prev) => ({ ...prev, [`cep_${target}`]: false }))
    }
  }

  async function fillPersonByCpf(target: 'primary' | 'secondary' | 'witness') {
    if (!selected) return
    const sourceCpf =
      target === 'primary' ? selected.partner_primary_data?.cpf : target === 'secondary' ? selected.partner_secondary_data?.cpf : selected.witness_data?.cpf
    const cpf = onlyDigits(sourceCpf || '')
    if (cpf.length !== 11) return setMessage({ type: 'error', text: 'Informe um CPF válido para busca.' })
    setSearching((prev) => ({ ...prev, [`cpf_${target}`]: true }))
    setMessage(null)
    try {
      const res = await fetch(`/api/cpfhub/cpf/${cpf}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('CPF não encontrado.')
      const data = await res.json()
      const payload = data?.result || data?.data || data || {}
      const name = payload?.nome || payload?.name || ''
      const birthDate = payload?.data_nascimento || payload?.birth_date || ''
      const sectionKey =
        target === 'primary' ? 'partner_primary_data' : target === 'secondary' ? 'partner_secondary_data' : 'witness_data'
      setSelected((prev) => {
        if (!prev) return prev
        const current = (prev as any)[sectionKey] || {}
        return {
          ...prev,
          [sectionKey]: {
            ...current,
            cpf,
            name: name || current.name || '',
            birth_date: birthDate || current.birth_date || '',
          },
        }
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Erro ao consultar CPF.' })
    } finally {
      setSearching((prev) => ({ ...prev, [`cpf_${target}`]: false }))
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    if (!canSave) return setMessage({ type: 'error', text: 'Informe o apelido da empresa.' })
    setSaving(true)
    setMessage(null)
    const res = await saveCompanyProfile(selected)
    if (res.success) {
      setMessage({ type: 'success', text: 'Cadastro de empresa salvo com sucesso.' })
      await loadData()
      if (selected.id) {
        const refreshed = (await getCompanyProfiles()) as any
        if (refreshed.success) {
          const found = (refreshed.companies || []).map(normalizeProfile).find((row: CompanyProfileRow) => row.id === selected.id)
          if (found) setSelected(found)
        }
      } else {
        setView('list')
      }
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao salvar cadastro de empresa.' })
    }
    setSaving(false)
  }

  async function handleArchive(id: string) {
    const ok = window.confirm('Deseja arquivar este cadastro de empresa?')
    if (!ok) return
    const res = await archiveCompanyProfile(id)
    if (!res.success) return setMessage({ type: 'error', text: res.error || 'Erro ao arquivar.' })
    setMessage({ type: 'success', text: 'Empresa arquivada com sucesso.' })
    await loadData()
    if (selected?.id === id) {
      setSelected(null)
      setView('list')
    }
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brs-gray-900)' }}>Cadastro da Empresa</div>
          <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>
            Cadastre quantas empresas precisar (multi-CNPJ) e vincule cada processo a uma empresa.
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setSelected({ ...EMPTY_PROFILE, partner_primary_data: { ...EMPTY_PERSON }, partner_secondary_data: { ...EMPTY_PERSON }, witness_data: { ...EMPTY_PERSON } })
            setView('edit')
          }}
        >
          <Plus size={16} />
          Nova Empresa
        </button>
      </div>

      {message && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 10,
            border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: message.type === 'success' ? '#065F46' : '#991B1B',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {view === 'list' ? (
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} />
            Empresas cadastradas
          </div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={16} className="spinner" />
              Carregando...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--brs-gray-100)' }}>
                    <th style={{ padding: '0.55rem' }}>Apelido</th>
                    <th style={{ padding: '0.55rem' }}>Razão Social</th>
                    <th style={{ padding: '0.55rem' }}>CNPJ</th>
                    <th style={{ padding: '0.55rem' }}>E-mail Principal</th>
                    <th style={{ padding: '0.55rem' }}>Status</th>
                    <th style={{ padding: '0.55rem' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.id || row.nickname} style={{ borderTop: '1px solid var(--brs-gray-100)' }}>
                      <td style={{ padding: '0.55rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setSelected(normalizeProfile(row))
                            setView('edit')
                          }}
                        >
                          {row.nickname}
                        </button>
                      </td>
                      <td style={{ padding: '0.55rem' }}>{row.company_data?.name || '—'}</td>
                      <td style={{ padding: '0.55rem' }}>{maskCnpj(String(row.cnpj || '')) || '—'}</td>
                      <td style={{ padding: '0.55rem' }}>{row.company_data?.email_principal || '—'}</td>
                      <td style={{ padding: '0.55rem' }}>{row.is_active ? 'Ativo' : 'Arquivado'}</td>
                      <td style={{ padding: '0.55rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => handleArchive(String(row.id || ''))}>
                          Arquivar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '0.75rem', color: 'var(--brs-gray-500)' }}>
                        Nenhuma empresa cadastrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="card" style={{ padding: '1rem', display: 'grid', gap: '0.9rem' }}>
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label className="form-label">Apelido</label>
              <input className="form-control" value={selected?.nickname || ''} onChange={(e) => setSelected((prev) => (prev ? { ...prev, nickname: e.target.value } : prev))} />
            </div>
            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="form-control" value={maskCnpj(String(selected?.cnpj || ''))} onChange={(e) => setSelected((prev) => (prev ? { ...prev, cnpj: onlyDigits(e.target.value) } : prev))} />
                <button type="button" className="btn btn-outline" onClick={fillCompanyByCnpj} disabled={!!searching.cnpj}>
                  {searching.cnpj ? <Loader2 size={16} className="spinner" /> : 'Buscar'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ativo</label>
              <label style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginTop: '0.55rem' }}>
                <input type="checkbox" checked={selected?.is_active !== false} onChange={(e) => setSelected((prev) => (prev ? { ...prev, is_active: e.target.checked } : prev))} />
                Ativo para uso
              </label>
            </div>
          </div>

          <div className="card" style={{ padding: '0.9rem', border: '1px solid var(--brs-gray-100)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Dados da Empresa</div>
            <div className="form-grid form-grid-4">
              <div className="form-group"><label className="form-label">Razão Social</label><input className="form-control" value={selected?.company_data?.name || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), name: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Nome Fantasia</label><input className="form-control" value={selected?.company_data?.fantasy_name || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), fantasy_name: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Data de Abertura</label><input type="date" className="form-control" value={selected?.company_data?.opening_date || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), opening_date: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Situação Cadastral</label><input className="form-control" value={selected?.company_data?.registration_status || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), registration_status: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Porte da Empresa</label><input className="form-control" value={selected?.company_data?.size || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), size: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Capital Social</label><input className="form-control" value={selected?.company_data?.capital_social || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), capital_social: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Natureza Jurídica</label><input className="form-control" value={selected?.company_data?.legal_nature || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), legal_nature: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">País</label><input className="form-control" value={selected?.company_data?.country || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), country: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">CEP</label><div style={{ display: 'flex', gap: '0.5rem' }}><input className="form-control" value={maskCep(selected?.company_data?.cep || '')} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), cep: onlyDigits(e.target.value) } } : prev)} /><button type="button" className="btn btn-outline" onClick={() => fillAddressByCep('company')} disabled={!!searching.cep_company}>{searching.cep_company ? <Loader2 size={16} className="spinner" /> : 'Buscar'}</button></div></div>
              <div className="form-group"><label className="form-label">UF</label><input className="form-control" value={selected?.company_data?.address_state || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), address_state: e.target.value.toUpperCase().slice(0, 2) } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Cidade</label><input className="form-control" value={selected?.company_data?.address_city || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), address_city: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Bairro</label><input className="form-control" value={selected?.company_data?.address_neighborhood || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), address_neighborhood: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Logradouro</label><input className="form-control" value={selected?.company_data?.address_street || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), address_street: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Número</label><input className="form-control" value={selected?.company_data?.address_number || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), address_number: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Complemento</label><input className="form-control" value={selected?.company_data?.address_complement || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), address_complement: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">E-mail Principal</label><input type="email" className="form-control" value={selected?.company_data?.email_principal || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), email_principal: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Telefone Principal</label><input className="form-control" value={maskPhone(selected?.company_data?.phone_principal || '')} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), phone_principal: onlyDigits(e.target.value) } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Banco Principal</label><input className="form-control" value={selected?.company_data?.bank_name || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), bank_name: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Agência</label><input className="form-control" value={selected?.company_data?.bank_agency || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), bank_agency: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Conta Corrente</label><input className="form-control" value={selected?.company_data?.bank_account || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), bank_account: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Tipo de Chave Pix</label><select className="form-control" value={selected?.company_data?.pix_type || 'cnpj'} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), pix_type: e.target.value as any } } : prev)}><option value="cnpj">CNPJ</option><option value="bank">Dados Bancários</option><option value="email">E-mail</option><option value="phone">Telefone</option><option value="random">Aleatória</option></select></div>
              <div className="form-group"><label className="form-label">Chave Pix</label><input className="form-control" value={selected?.company_data?.pix_key || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), pix_key: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Latitude</label><input className="form-control" value={selected?.company_data?.latitude || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), latitude: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Longitude</label><input className="form-control" value={selected?.company_data?.longitude || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), longitude: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Site</label><input className="form-control" value={selected?.company_data?.site || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), site: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">E-mail Suporte</label><input type="email" className="form-control" value={selected?.company_data?.email_support || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), email_support: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">WhatsApp Suporte</label><input className="form-control" value={selected?.company_data?.whatsapp_support || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), whatsapp_support: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Comunidade WhatsApp</label><input className="form-control" value={selected?.company_data?.whatsapp_community || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), whatsapp_community: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Instagram</label><input className="form-control" value={selected?.company_data?.instagram || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), instagram: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Facebook</label><input className="form-control" value={selected?.company_data?.facebook || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), facebook: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Tik Tok</label><input className="form-control" value={selected?.company_data?.tiktok || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), tiktok: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">LinkedIn</label><input className="form-control" value={selected?.company_data?.linkedin || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), linkedin: e.target.value } } : prev)} /></div>
              <div className="form-group"><label className="form-label">Canal YouTube</label><input className="form-control" value={selected?.company_data?.youtube || ''} onChange={(e) => setSelected((prev) => prev ? { ...prev, company_data: { ...(prev.company_data || {}), youtube: e.target.value } } : prev)} /></div>
            </div>
          </div>

          <PersonSection
            title="Sócio Principal"
            value={selected?.partner_primary_data || { ...EMPTY_PERSON }}
            setValue={(next) => setSelected((prev) => (prev ? { ...prev, partner_primary_data: next } : prev))}
            loadingCpf={!!searching.cpf_primary}
            loadingCep={!!searching.cep_primary}
            onFetchCpf={() => fillPersonByCpf('primary')}
            onFetchCep={() => fillAddressByCep('primary')}
          />
          <PersonSection
            title="Sócio Secundário"
            value={selected?.partner_secondary_data || { ...EMPTY_PERSON }}
            setValue={(next) => setSelected((prev) => (prev ? { ...prev, partner_secondary_data: next } : prev))}
            loadingCpf={!!searching.cpf_secondary}
            loadingCep={!!searching.cep_secondary}
            onFetchCpf={() => fillPersonByCpf('secondary')}
            onFetchCep={() => fillAddressByCep('secondary')}
          />
          <PersonSection
            title="Testemunha"
            value={selected?.witness_data || { ...EMPTY_PERSON }}
            setValue={(next) => setSelected((prev) => (prev ? { ...prev, witness_data: next } : prev))}
            loadingCpf={!!searching.cpf_witness}
            loadingCep={!!searching.cep_witness}
            onFetchCpf={() => fillPersonByCpf('witness')}
            onFetchCep={() => fillAddressByCep('witness')}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setView('list')}>
              Voltar para lista
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !canSave}>
              {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
              Salvar Empresa
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
