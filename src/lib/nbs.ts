import { onlyDigits } from '@/lib/company-bank-accounts'

export type NbsRecord = {
  id?: string
  code: string
  description: string
  is_active?: boolean
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `nbs-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeNbsCodeDigits(value: string) {
  return onlyDigits(String(value || '')).slice(0, 9)
}

export function formatNbsCode(value: string) {
  const digits = normalizeNbsCodeDigits(value)
  if (!digits) return ''

  const first = digits.slice(0, 1)
  const second = digits.slice(1, 5)
  const third = digits.slice(5, 7)
  const fourth = digits.slice(7, 9)

  let formatted = first
  if (digits.length > 1) formatted += `.${second}`
  if (digits.length > 5) formatted += `.${third}`
  if (digits.length > 7) formatted += `.${fourth}`
  return formatted
}

export function normalizeNbsDescription(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

export function createEmptyNbs(): NbsRecord {
  return {
    id: createId(),
    code: '',
    description: '',
    is_active: true,
    deleted_at: null,
  }
}

export function normalizeNbsRecord(input: unknown): NbsRecord {
  const record = isRecord(input) ? input : {}
  return {
    id: record.id ? String(record.id) : undefined,
    code: normalizeNbsCodeDigits(String(record.code || record.nbs || '')),
    description: normalizeNbsDescription(String(record.description || record.descricao || '')),
    is_active: record.is_active !== false,
    deleted_at: record.deleted_at ? String(record.deleted_at) : null,
    created_at: record.created_at ? String(record.created_at) : undefined,
    updated_at: record.updated_at ? String(record.updated_at) : undefined,
  }
}
