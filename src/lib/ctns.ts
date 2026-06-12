import { onlyDigits } from '@/lib/company-bank-accounts'

export type CtnRecord = {
  id?: string
  code: string
  description: string
  is_active?: boolean
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `ctn-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeCtnCodeDigits(value: string) {
  return onlyDigits(String(value || '')).slice(0, 6)
}

export function formatCtnCode(value: string) {
  const digits = normalizeCtnCodeDigits(value)
  if (!digits) return ''
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}.${digits.slice(2)}`
}

export function normalizeCtnDescription(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

export function createEmptyCtn(): CtnRecord {
  return {
    id: createId(),
    code: '',
    description: '',
    is_active: true,
    deleted_at: null,
  }
}

export function normalizeCtnRecord(input: unknown): CtnRecord {
  const record = isRecord(input) ? input : {}
  return {
    id: record.id ? String(record.id) : undefined,
    code: normalizeCtnCodeDigits(String(record.code || record.ctn || '')),
    description: normalizeCtnDescription(String(record.description || record.descricao || '')),
    is_active: record.is_active !== false,
    deleted_at: record.deleted_at ? String(record.deleted_at) : null,
    created_at: record.created_at ? String(record.created_at) : undefined,
    updated_at: record.updated_at ? String(record.updated_at) : undefined,
  }
}
