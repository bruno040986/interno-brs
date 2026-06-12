export type CommercialTypeRecord = {
  id?: string
  name: string
  is_active?: boolean
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export function normalizeCommercialTypeName(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}
