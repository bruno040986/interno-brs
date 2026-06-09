'use client'

import { useEffect, useMemo, useState } from 'react'
import { archiveCompanyProfile, getCompanyProfiles, saveCompanyProfile } from '../../actions'
import { AlertCircle, BadgeCheck, Banknote, Building2, CheckCircle, ImageIcon, Loader2, Plus, Save, Trash2, Upload } from 'lucide-react'
import {
  createEmptyBankAccount,
  formatBankAccountFromSeq,
  formatBankAgencyWithDigitFromSeq,
  formatBankLabel,
  getBankBrandIcon,
  maskCnpj,
  maskCep,
  maskCpf,
  maskEmailInput,
  maskPhone,
  maskUuidInput,
  normalizeCompanyBankAccounts,
  normalizePixKeyValue,
  onlyDigits,
  parseBankAccountSeq,
  parseBankAgencySeq,
  type BankLookup,
  type CompanyBankAccount,
} from '@/lib/company-bank-accounts'

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
  bank_accounts?: CompanyBankAccount[]
  bank_name?: string
  bank_code?: string
  bank_ispb?: string
  bank_full_name?: string
  bank_logo_data_url?: string
  bank_agency?: string
  bank_account?: string
  bank_account_type?: 'Corrente' | 'Poupança'
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
    bank_accounts: [createEmptyBankAccount({ is_principal: true })],
    bank_name: '',
    bank_code: '',
    bank_ispb: '',
    bank_full_name: '',
    bank_logo_data_url: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: 'Corrente',
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

function normalizeProfile(
  raw: Partial<CompanyProfileRow> & {
    company_data?: CompanyData
    partner_primary_data?: PersonData
    partner_secondary_data?: PersonData
    witness_data?: PersonData
  },
): CompanyProfileRow {
  const normalizedCompanyData = normalizeCompanyBankAccounts(raw?.company_data || {}, String(raw?.cnpj || ''))
  return {
    id: raw?.id,
    nickname: String(raw?.nickname || ''),
    is_active: raw?.is_active !== false,
    cnpj: String(raw?.cnpj || ''),
    company_data: { ...EMPTY_PROFILE.company_data, ...normalizedCompanyData },
    partner_primary_data: { ...EMPTY_PERSON, ...(raw?.partner_primary_data || {}) },
    partner_secondary_data: { ...EMPTY_PERSON, ...(raw?.partner_secondary_data || {}) },
    witness_data: { ...EMPTY_PERSON, ...(raw?.witness_data || {}) },
  }
}

function inferAppendOnlySequence(prevSeq: string, currentValue: string, maxDigits: number): string {
  const prev = String(prevSeq || '').replace(/\D/g, '').slice(0, maxDigits)
  const next = String(currentValue || '').replace(/\D/g, '').slice(0, maxDigits)
  if (!prev) return next
  if (!next) return ''
  if (next.startsWith(prev)) return next.slice(0, maxDigits)
  if (next.length < prev.length) return next
  if (next.length - prev.length > 1) return next.slice(0, maxDigits)
  const lastDigit = next.slice(-1)
  return `${prev}${lastDigit}`.slice(0, maxDigits)
}

function handleDigitSequenceKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  prevSeq: string,
  setSeq: (next: string) => void,
  maxDigits: number,
) {
  const key = e.key
  const digitFromCode = (() => {
    const code = String(e.code || '')
    const m = code.match(/^Numpad([0-9])$/)
    return m ? m[1] : null
  })()

  if (key === 'Backspace') {
    e.preventDefault()
    setSeq(prevSeq.slice(0, -1))
    return
  }

  if (key === 'Delete') {
    e.preventDefault()
    setSeq('')
    return
  }

  if (key === 'Tab' || key.startsWith('Arrow') || key === 'Home' || key === 'End') return

  const digit = /^\d$/.test(key) ? key : digitFromCode
  if (digit) {
    e.preventDefault()
    if (prevSeq.length >= maxDigits) return
    setSeq((prevSeq + digit).slice(0, maxDigits))
    return
  }

  if (key.length === 1) {
    e.preventDefault()
  }
}

function handleDigitSequencePaste(
  e: React.ClipboardEvent<HTMLInputElement>,
  prevSeq: string,
  setSeq: (next: string) => void,
  maxDigits: number,
) {
  const txt = e.clipboardData.getData('text') || ''
  const digits = txt.replace(/\D/g, '')
  if (!digits) return
  e.preventDefault()
  const next = (String(prevSeq || '').replace(/\D/g, '') + digits).slice(0, maxDigits)
  setSeq(next)
}

function handleDigitSequenceChange(
  e: React.ChangeEvent<HTMLInputElement>,
  prevSeq: string,
  setSeq: (next: string) => void,
  maxDigits: number,
) {
  const native = e.nativeEvent as unknown as { data?: string | null; inputType?: string }
  const inputType = String(native?.inputType || '')
  const dataDigits = String(native?.data ?? '').replace(/\D/g, '')

  if (inputType.startsWith('delete')) {
    setSeq(prevSeq.slice(0, -1))
    return
  }

  if (dataDigits) {
    setSeq((String(prevSeq || '').replace(/\D/g, '') + dataDigits).slice(0, maxDigits))
    return
  }

  setSeq(inferAppendOnlySequence(prevSeq, e.target.value, maxDigits))
}

function BankIcon({
  bankCode,
  bankName,
}: {
  bankCode?: string
  bankName?: string
}) {
  const icon = getBankBrandIcon(bankCode, bankName)

  if (icon) {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-label={icon.title} style={{ width: 28, height: 28, display: 'block' }}>
        <path fill={`#${icon.hex}`} d={icon.path} />
      </svg>
    )
  }

  return <Banknote size={22} />
}

function CompanyBankAccountCard({
  account,
  companyCnpj,
  banks,
  banksLoading,
  onChange,
  onRemove,
  onMakePrincipal,
}: {
  account: CompanyBankAccount
  companyCnpj: string
  banks: BankLookup[]
  banksLoading: boolean
  onChange: (next: CompanyBankAccount) => void
  onRemove: () => void
  onMakePrincipal: () => void
}) {
  const [bankSearch, setBankSearch] = useState(account.bank_code || account.bank_name ? formatBankLabel({
    code: account.bank_code,
    name: account.bank_name,
    fullName: account.bank_full_name,
  }) : '')
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false)
  const [agencySeq, setAgencySeq] = useState(parseBankAgencySeq(account.bank_agency))
  const [accountSeq, setAccountSeq] = useState(parseBankAccountSeq(account.bank_account))

  useEffect(() => {
    setAgencySeq(parseBankAgencySeq(account.bank_agency))
  }, [account.bank_agency])

  useEffect(() => {
    setAccountSeq(parseBankAccountSeq(account.bank_account))
  }, [account.bank_account])

  const filteredBanks = useMemo(() => {
    const query = bankSearch.trim().toLowerCase()
    if (!bankDropdownOpen || query.length < 3) return []
    return banks
      .filter((bank) => {
        const label = formatBankLabel(bank).toLowerCase()
        const code = String(bank.code || '').toLowerCase()
        const fullName = String(bank.fullName || '').toLowerCase()
        return label.includes(query) || code.includes(query) || fullName.includes(query)
      })
      .slice(0, 12)
  }, [banks, bankDropdownOpen, bankSearch])

  const uploadedLogo = String(account.bank_logo_data_url || '').trim()
  const autoIcon = getBankBrandIcon(account.bank_code, account.bank_name)

  async function handleLogoUpload(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onChange({
        ...account,
        bank_logo_data_url: String(reader.result || ''),
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="card" style={{ padding: '0.9rem', border: '1px solid var(--brs-gray-100)', background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, border: '1px solid var(--brs-gray-200)', background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            {uploadedLogo ? (
              <img src={uploadedLogo} alt="Logo do banco" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : autoIcon ? (
              <BankIcon bankCode={account.bank_code} bankName={account.bank_name} />
            ) : (
              <ImageIcon size={20} color="var(--brs-gray-400)" />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)' }}>Conta Bancária {account.name ? `- ${account.name}` : `#${String(account.id || '').slice(0, 6)}`}</div>
              {account.is_principal ? (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: 999, background: '#DCFCE7', color: '#166534' }}>
                  Conta Principal
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--brs-gray-500)' }}>
              {account.bank_name || 'Selecione um banco'} {account.bank_code ? `• ${String(account.bank_code).padStart(3, '0')}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!account.is_principal ? (
            <button type="button" className="btn btn-outline" onClick={onMakePrincipal}>
              <BadgeCheck size={16} />
              Definir como principal
            </button>
          ) : null}
          <button type="button" className="btn btn-outline" onClick={onRemove}>
            <Trash2 size={16} />
            Remover
          </button>
        </div>
      </div>

      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Nome da Conta</label>
          <input
            className="form-control"
            maxLength={100}
            value={account.name || ''}
            onChange={(e) => onChange({ ...account, name: e.target.value.slice(0, 100) })}
            placeholder="Conta principal, reserva, folha..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Banco</label>
          <div style={{ position: 'relative' }}>
            <input
              className="form-control"
              value={bankSearch}
              onChange={(e) => {
                const next = e.target.value
                setBankSearch(next)
                setBankDropdownOpen(true)
                onChange({
                  ...account,
                  bank_code: '',
                  bank_name: '',
                  bank_ispb: '',
                  bank_full_name: '',
                  bank_logo_data_url: '',
                })
              }}
              onFocus={() => setBankDropdownOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setBankDropdownOpen(false), 150)
              }}
              placeholder={banksLoading ? 'Carregando bancos...' : 'Digite ao menos 3 caracteres'}
            />
            {bankSearch.trim().length > 0 && bankSearch.trim().length < 3 ? (
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>Digite pelo menos 3 caracteres para buscar.</div>
            ) : null}
            {bankDropdownOpen ? (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 25,
                  background: 'var(--brs-white)',
                  border: '1px solid var(--brs-gray-200)',
                  borderRadius: 12,
                  maxHeight: 240,
                  overflowY: 'auto',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                }}
              >
                {filteredBanks.map((bank) => {
                  const label = formatBankLabel(bank)
                  return (
                    <button
                      key={`${bank.code}-${bank.name}`}
                      type="button"
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '0.65rem 0.85rem' }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setBankSearch(label)
                        setBankDropdownOpen(false)
                        onChange({
                          ...account,
                          bank_code: String(bank.code || ''),
                          bank_name: String(bank.name || '').trim(),
                          bank_ispb: String(bank.ispb || '').trim(),
                          bank_full_name: String(bank.fullName || '').trim(),
                          bank_logo_data_url: '',
                        })
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
                {bankSearch.trim().length >= 3 && filteredBanks.length === 0 ? (
                  <div style={{ padding: '0.75rem 0.85rem', color: 'var(--brs-gray-500)', fontSize: '0.85rem' }}>Nenhum banco encontrado.</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Logotipo</label>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, border: '1px solid var(--brs-gray-200)', background: '#fff', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
              {uploadedLogo ? (
                <img src={uploadedLogo} alt="Logo do banco" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : autoIcon ? (
                <BankIcon bankCode={account.bank_code} bankName={account.bank_name} />
              ) : (
                <ImageIcon size={22} color="var(--brs-gray-400)" />
              )}
            </div>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', width: 'fit-content' }}>
                <Upload size={16} />
                Upload do logo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    void handleLogoUpload(file)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
              {uploadedLogo ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: 'fit-content' }}
                  onClick={() => onChange({ ...account, bank_logo_data_url: '' })}
                >
                  Remover logo enviado
                </button>
              ) : null}
              <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>
                Se houver ícone público compatível, usamos automaticamente. Caso contrário, faça o upload.
              </div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Agência com dígito</label>
          <input
            className="form-control"
            inputMode="numeric"
            value={formatBankAgencyWithDigitFromSeq(agencySeq)}
            onChange={(e) => {
              handleDigitSequenceChange(e, agencySeq, (nextSeq) => {
                const seq = parseBankAgencySeq(nextSeq)
                setAgencySeq(seq)
                onChange({ ...account, bank_agency: seq })
              }, 5)
            }}
            onKeyDown={(e) => {
              handleDigitSequenceKeyDown(e, agencySeq, (nextSeq) => {
                const seq = parseBankAgencySeq(nextSeq)
                setAgencySeq(seq)
                onChange({ ...account, bank_agency: seq })
              }, 5)
            }}
            onPaste={(e) => {
              handleDigitSequencePaste(e, agencySeq, (nextSeq) => {
                const seq = parseBankAgencySeq(nextSeq)
                setAgencySeq(seq)
                onChange({ ...account, bank_agency: seq })
              }, 5)
            }}
            placeholder="1234-5"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Conta com dígito</label>
          <input
            className="form-control"
            inputMode="numeric"
            value={formatBankAccountFromSeq(accountSeq)}
            onChange={(e) => {
              handleDigitSequenceChange(e, accountSeq, (nextSeq) => {
                const seq = parseBankAccountSeq(nextSeq)
                setAccountSeq(seq)
                onChange({ ...account, bank_account: seq })
              }, 11)
            }}
            onKeyDown={(e) => {
              handleDigitSequenceKeyDown(e, accountSeq, (nextSeq) => {
                const seq = parseBankAccountSeq(nextSeq)
                setAccountSeq(seq)
                onChange({ ...account, bank_account: seq })
              }, 11)
            }}
            onPaste={(e) => {
              handleDigitSequencePaste(e, accountSeq, (nextSeq) => {
                const seq = parseBankAccountSeq(nextSeq)
                setAccountSeq(seq)
                onChange({ ...account, bank_account: seq })
              }, 11)
            }}
            placeholder="0000000000-0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tipo de Conta</label>
          <select
            className="form-control"
            value={account.bank_account_type || 'Corrente'}
            onChange={(e) => onChange({ ...account, bank_account_type: e.target.value === 'Poupança' ? 'Poupança' : 'Corrente' })}
          >
            <option value="Corrente">Corrente</option>
            <option value="Poupança">Poupança</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tipo de Chave Pix</label>
          <select
            className="form-control"
            value={account.pix_type || 'cnpj'}
            onChange={(e) => {
              const nextType = e.target.value as CompanyBankAccount['pix_type']
              onChange({
                ...account,
                pix_type: nextType,
                pix_key:
                  nextType === 'cnpj'
                    ? normalizePixKeyValue(companyCnpj, 'cnpj', companyCnpj)
                    : nextType === 'bank'
                      ? ''
                      : '',
              })
            }}
          >
            <option value="cnpj">CNPJ</option>
            <option value="phone">Celular</option>
            <option value="email">E-mail</option>
            <option value="bank">Dados Bancários</option>
            <option value="random">Aleatória</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Chave Pix</label>
          {account.pix_type === 'bank' ? (
            <div className="form-control" style={{ display: 'flex', alignItems: 'center', color: 'var(--brs-gray-500)' }}>
              Dados bancários cadastrados
            </div>
          ) : (
            <input
              className="form-control"
              autoComplete={account.pix_type === 'email' ? 'email' : 'off'}
              inputMode={account.pix_type === 'phone' ? 'numeric' : account.pix_type === 'email' ? 'email' : 'text'}
              value={
                account.pix_type === 'cnpj'
                  ? maskCnpj(companyCnpj)
                  : account.pix_type === 'phone'
                    ? maskPhone(account.pix_key || '')
                    : account.pix_type === 'random'
                      ? maskUuidInput(account.pix_key || '')
                      : account.pix_type === 'email'
                        ? maskEmailInput(account.pix_key || '')
                        : account.pix_key || ''
              }
              onChange={(e) => {
                if (account.pix_type === 'phone') {
                  onChange({ ...account, pix_key: onlyDigits(e.target.value).slice(0, 11) })
                  return
                }
                if (account.pix_type === 'random') {
                  onChange({ ...account, pix_key: maskUuidInput(e.target.value) })
                  return
                }
                if (account.pix_type === 'email') {
                  onChange({ ...account, pix_key: maskEmailInput(e.target.value) })
                  return
                }
                onChange({ ...account, pix_key: e.target.value })
              }}
              onBlur={(e) =>
                onChange({
                  ...account,
                  pix_key: normalizePixKeyValue(e.target.value, String(account.pix_type || 'cnpj'), companyCnpj),
                })
              }
              placeholder={
                account.pix_type === 'random'
                  ? '123e4567-e89b-12d3-a456-426614174000'
                  : account.pix_type === 'phone'
                    ? '(99) 99999-9999'
                    : account.pix_type === 'email'
                      ? 'nome@dominio.com'
                      : maskCnpj(companyCnpj)
              }
            />
          )}
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginTop: '0.55rem' }}>
            <input
              type="checkbox"
              checked={!!account.is_principal}
              onChange={(e) => {
                if (e.target.checked) onMakePrincipal()
              }}
            />
            Conta principal
          </label>
        </div>
      </div>
    </div>
  )
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
  const [banks, setBanks] = useState<BankLookup[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState<Record<string, boolean>>({})
  const [view, setView] = useState<'list' | 'edit'>('list')
  const [selected, setSelected] = useState<CompanyProfileRow | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      if (!banks.length && !banksLoading) {
        setBanksLoading(true)
        try {
          const banksRes = await fetch('/api/lookups/banks')
          if (banksRes.ok) {
            const banksData = await banksRes.json()
            setBanks(Array.isArray(banksData?.banks) ? banksData.banks : [])
          }
        } finally {
          setBanksLoading(false)
        }
      }

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
    // Initial load needs client-side state updates after fetching.
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    loadData()
    }, [])

  const canSave = useMemo(() => {
    return !!selected?.nickname?.trim()
  }, [selected?.nickname])

  const bankAccounts = useMemo(() => {
    return Array.isArray(selected?.company_data?.bank_accounts) ? selected?.company_data?.bank_accounts : []
  }, [selected?.company_data?.bank_accounts])

  function syncBankAccounts(nextAccounts: CompanyBankAccount[]) {
    setSelected((prev) => {
      if (!prev) return prev
      const nextCompanyData = normalizeCompanyBankAccounts(
        {
          ...(prev.company_data || {}),
          bank_accounts: nextAccounts,
        },
        String(prev.cnpj || ''),
      )
      return {
        ...prev,
        company_data: {
          ...(prev.company_data || {}),
          ...nextCompanyData,
        },
      }
    })
  }

  function updateBankAccount(index: number, nextAccount: CompanyBankAccount) {
    const next = [...bankAccounts]
    next[index] = nextAccount
    if (!next.some((account) => account.is_principal)) {
      next[0] = { ...next[0], is_principal: true }
    }
    syncBankAccounts(next)
  }

  function addBankAccount() {
    const next = [
      ...bankAccounts,
      createEmptyBankAccount({
        id: `bank-${Date.now()}`,
        is_principal: bankAccounts.length === 0,
      }),
    ]
    if (!next.some((account) => account.is_principal)) {
      next[0] = { ...next[0], is_principal: true }
    }
    syncBankAccounts(next)
  }

  function removeBankAccount(index: number) {
    const next = bankAccounts.filter((_, currentIndex) => currentIndex !== index)
    if (!next.length) {
      next.push(createEmptyBankAccount({ is_principal: true }))
    } else if (!next.some((account) => account.is_principal)) {
      next[0] = { ...next[0], is_principal: true }
    }
    syncBankAccounts(next)
  }

  function makePrincipalBankAccount(index: number) {
    const next = bankAccounts.map((account, currentIndex) => ({
      ...account,
      is_principal: currentIndex === index,
    }))
    syncBankAccounts(next)
  }

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

          <div className="card" style={{ padding: '1rem', border: '1px solid var(--brs-gray-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--brs-gray-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Banknote size={18} />
                  Contas Bancárias
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--brs-gray-500)' }}>
                  Cadastre uma ou mais contas da empresa. Apenas uma pode ser principal.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.9rem' }}>
              {bankAccounts.map((account, index) => (
                <CompanyBankAccountCard
                  key={account.id || index}
                  account={account}
                  companyCnpj={String(selected?.cnpj || '')}
                  banks={banks}
                  banksLoading={banksLoading}
                  onChange={(next) => updateBankAccount(index, next)}
                  onRemove={() => removeBankAccount(index)}
                  onMakePrincipal={() => makePrincipalBankAccount(index)}
                />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.9rem' }}>
              <button type="button" className="btn btn-primary" onClick={addBankAccount}>
                <Plus size={16} />
                Nova Conta Bancária
              </button>
            </div>
          </div>

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
