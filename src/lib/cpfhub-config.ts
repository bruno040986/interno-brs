import { createAdminClient } from '@/lib/supabase/server'

export type CpfHubPlan = 'gratuito' | 'pago'

export type CpfHubConfigRow = {
  id: string
  email: string
  api_key: string
  plan: CpfHubPlan
  free_queries_per_month: number
  created_at?: string | null
  updated_at?: string | null
}

export type CpfHubConfigState = CpfHubConfigRow & {
  has_api_key: boolean
}

function normalizePlan(value: unknown): CpfHubPlan {
  return String(value || '').toLowerCase() === 'pago' ? 'pago' : 'gratuito'
}

function normalizePositiveInt(value: unknown) {
  const next = Number.parseInt(String(value ?? '0'), 10)
  if (!Number.isFinite(next) || next < 0) return 0
  return Math.trunc(next)
}

export function createEmptyCpfHubConfig(): CpfHubConfigState {
  return {
    id: '',
    email: '',
    api_key: '',
    plan: 'gratuito',
    free_queries_per_month: 0,
    created_at: null,
    updated_at: null,
    has_api_key: false,
  }
}

export async function getCpfHubConfig(): Promise<CpfHubConfigState> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('cpfhub_config')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!data) return createEmptyCpfHubConfig()

    return {
      id: String(data.id || ''),
      email: String(data.email || ''),
      api_key: '',
      plan: normalizePlan(data.plan),
      free_queries_per_month: normalizePositiveInt(data.free_queries_per_month),
      created_at: data.created_at || null,
      updated_at: data.updated_at || null,
      has_api_key: Boolean(data.api_key),
    }
  } catch {
    return createEmptyCpfHubConfig()
  }
}

export async function getCpfHubApiKey(): Promise<string | null> {
  const config = await getCpfHubConfig()
  if (config.has_api_key) {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('cpfhub_config')
      .select('api_key')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    const apiKey = String(data?.api_key || '').trim()
    if (apiKey) return apiKey
  }

  const envApiKey = String(process.env.CPFHUB_API_KEY || '').trim()
  return envApiKey || null
}

export async function saveCpfHubConfig(input: {
  id?: string
  email: string
  api_key?: string
  plan: CpfHubPlan
  free_queries_per_month: number
}) {
  const supabase = await createAdminClient()
  const existing = input.id
    ? await supabase
        .from('cpfhub_config')
        .select('id, api_key, created_at')
        .eq('id', input.id)
        .maybeSingle()
    : { data: null, error: null }

  if (input.id && existing.error) throw existing.error

  const existingApiKey = String(existing.data?.api_key || '')
  const apiKey = String(input.api_key || '').trim() || existingApiKey

  if (!input.id && !apiKey) {
    throw new Error('A chave de API e obrigatoria no primeiro cadastro.')
  }

  const payload = {
    email: String(input.email || '').trim(),
    api_key: apiKey,
    plan: normalizePlan(input.plan),
    free_queries_per_month: normalizePositiveInt(input.free_queries_per_month),
    updated_at: new Date().toISOString(),
  }

  if (input.id) {
    const { error } = await supabase.from('cpfhub_config').upsert(
      {
        id: input.id,
        ...payload,
        created_at: existing.data?.created_at || new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

    if (error) throw error
    return { id: input.id }
  }

  const { data, error } = await supabase
    .from('cpfhub_config')
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return { id: String(data?.id || '') }
}
