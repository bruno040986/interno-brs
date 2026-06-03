import { createAdminClient } from '@/lib/supabase/server'
import type { CommercialCompanyLinksProfile } from '@/lib/commercial-card'

type PublicCommercialEntity = {
  id: string
  name: string
  role: 'superintendente' | 'supervisor' | 'gerente'
  status: 'ativo' | 'inativo'
  commercial_slug: string | null
  card_enabled: boolean | null
  user_id: string | null
  phone_whatsapp: string | null
  email_comissao: string | null
  cadastral_data: Record<string, any> | null
  arw_data: Record<string, any> | null
  card_data: Record<string, any> | null
}

type PublicCommercialUser = {
  name?: string | null
  avatar_url?: string | null
}

export type PublicCommercialCardData = {
  entity: PublicCommercialEntity
  companyProfile: CommercialCompanyLinksProfile | null
  linkedUser: PublicCommercialUser | null
}

function normalizeSlug(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function getPublicCommercialCardBySlug(slug: string): Promise<PublicCommercialCardData | null> {
  const normalized = normalizeSlug(slug)
  if (!normalized) return null

  const admin = await createAdminClient()

  const { data: entity, error: entityError } = await admin
    .from('commercial_entities')
    .select(
      'id, name, role, status, commercial_slug, card_enabled, user_id, phone_whatsapp, email_comissao, cadastral_data, arw_data, card_data'
    )
    .eq('commercial_slug', normalized)
    .eq('card_enabled', true)
    .eq('status', 'ativo')
    .limit(1)
    .maybeSingle()

  if (entityError) throw entityError
  if (!entity) return null

  const unit = String(entity.arw_data?.unidade || '').trim().toLowerCase()
  let companyProfile: CommercialCompanyLinksProfile | null = null

  if (unit) {
    const { data: companies, error: companyError } = await admin
      .from('company_profiles')
      .select('nickname, company_data, is_active')
      .eq('is_active', true)
      .order('nickname', { ascending: true })

    if (companyError) throw companyError
    const company = (companies || []).find((row) => String(row.nickname || '').trim().toLowerCase() === unit)
    if (company) {
      companyProfile = {
        nickname: String(company.nickname || '').trim(),
        company_data: company.company_data || {},
      }
    }
  }

  let linkedUser: PublicCommercialUser | null = null
  if (entity.user_id) {
    const { data: user, error: userError } = await admin
      .from('users')
      .select('name, avatar_url')
      .eq('id', entity.user_id)
      .limit(1)
      .maybeSingle()

    if (userError) throw userError
    if (user) {
      linkedUser = {
        name: user.name || null,
        avatar_url: user.avatar_url || null,
      }
    }
  }

  return {
    entity,
    companyProfile,
    linkedUser,
  }
}
