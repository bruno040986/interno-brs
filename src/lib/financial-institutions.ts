export type FinancialInstitutionRecord = {
  id?: string
  name: string
  logo_url?: string
  is_active?: boolean
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export function normalizeFinancialInstitutionName(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeFinancialInstitutionLogo(value: string) {
  return String(value || '').trim()
}
