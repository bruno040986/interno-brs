import { onlyDigits } from '@/lib/company-bank-accounts'

export type CnaeRecord = {
  id?: string
  code: string
  description: string
  is_active?: boolean
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `cnae-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeCnaeCodeDigits(value: string) {
  return onlyDigits(String(value || '')).slice(0, 7)
}

export function formatCnaeCode(value: string) {
  const digits = normalizeCnaeCodeDigits(value)
  if (!digits) return ''

  const first = digits.slice(0, 4)
  const fifth = digits.slice(4, 5)
  const last = digits.slice(5, 7)

  let formatted = first
  if (digits.length > 4) formatted += `-${fifth}`
  if (digits.length > 5) formatted += `/${last}`
  return formatted
}

export function normalizeCnaeDescription(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

export function createEmptyCnae(): CnaeRecord {
  return {
    id: createId(),
    code: '',
    description: '',
    is_active: true,
    deleted_at: null,
  }
}

export function normalizeCnaeRecord(input: unknown): CnaeRecord {
  const record = isRecord(input) ? input : {}
  return {
    id: record.id ? String(record.id) : undefined,
    code: normalizeCnaeCodeDigits(String(record.code || record.cnae || '')),
    description: normalizeCnaeDescription(String(record.description || record.descricao || '')),
    is_active: record.is_active !== false,
    deleted_at: record.deleted_at ? String(record.deleted_at) : null,
    created_at: record.created_at ? String(record.created_at) : undefined,
    updated_at: record.updated_at ? String(record.updated_at) : undefined,
  }
}
