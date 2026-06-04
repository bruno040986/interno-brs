import { createAdminClient } from '@/lib/supabase/server'
import type { CommercialCompanyLinksProfile } from '@/lib/commercial-card'

type PublicCommercialEntityRow = {
  id: string
  name: string
  role: 'superintendente' | 'supervisor' | 'gerente'
  status: 'ativo' | 'inativo'
  commercial_slug: string | null
  card_enabled: boolean | null
  user_id: string | null
  parent_id: string | null
  phone_whatsapp: string | null
  email_comissao: string | null
  cadastral_data: Record<string, any> | null
  arw_data: Record<string, any> | null
  card_data: Record<string, any> | null
}

type PublicCommercialEntityRelation = {
  id: string
  name: string
  role: 'superintendente' | 'supervisor' | 'gerente'
  commercial_slug: string | null
  cadastral_data: Record<string, any> | null
}

type PublicCommercialUser = {
  id: string
  name?: string | null
  avatar_url?: string | null
}

export type PublicCommercialCardLink = {
  id: string
  name: string
  destination_url: string
  icon_key: string
  position: number
  is_active: boolean
}

export type PublicCommercialCardData = {
  entity: PublicCommercialEntityRow
  companyProfile: CommercialCompanyLinksProfile | null
  linkedUser: PublicCommercialUser | null
  cardLinks: PublicCommercialCardLink[]
  parent: PublicCommercialEntityRelation | null
  superior: PublicCommercialEntityRelation | null
}

export type PublicCommercialPreviewCard = PublicCommercialCardData

function normalizeSlug(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function isActiveStatus(status: string | null | undefined) {
  const normalized = String(status || '').trim().toLowerCase()
  return normalized === 'ativo' || normalized === 'active'
}

function normalizeCompanyProfile(company: { nickname?: string | null; company_data?: CommercialCompanyLinksProfile['company_data'] | null }) {
  return {
    nickname: String(company.nickname || '').trim(),
    company_data: company.company_data || {},
  }
}

function normalizeRelation(entity: {
  id: string
  name: string
  role: 'superintendente' | 'supervisor' | 'gerente'
  commercial_slug: string | null
  cadastral_data: Record<string, any> | null
} | null | undefined): PublicCommercialEntityRelation | null {
  if (!entity) return null
  return {
    id: entity.id,
    name: entity.name,
    role: entity.role,
    commercial_slug: entity.commercial_slug,
    cadastral_data: entity.cadastral_data || {},
  }
}

function normalizeCardLink(link: {
  id: string
  name: string
  destination_url: string
  icon_key: string
  position: number
  is_active: boolean
}): PublicCommercialCardLink {
  return {
    id: link.id,
    name: String(link.name || '').trim(),
    destination_url: String(link.destination_url || '').trim(),
    icon_key: String(link.icon_key || 'link').trim() || 'link',
    position: Number(link.position || 0),
    is_active: !!link.is_active,
  }
}

async function fetchCommercialEntities(admin: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data, error } = await admin
    .from('commercial_entities')
    .select('id, name, role, status, commercial_slug, card_enabled, user_id, parent_id, phone_whatsapp, email_comissao, cadastral_data, arw_data, card_data')
    .order('name')

  if (error) throw error
  return (data || []) as PublicCommercialEntityRow[]
}

async function fetchCompanyProfiles(admin: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data, error } = await admin
    .from('company_profiles')
    .select('nickname, company_data, is_active')
    .eq('is_active', true)
    .order('nickname', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizeCompanyProfile)
}

async function fetchCardLinks(admin: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data, error } = await admin
    .from('commercial_card_links')
    .select('id, name, destination_url, icon_key, position, is_active')
    .eq('is_active', true)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data || []) as Array<{
    id: string
    name: string
    destination_url: string
    icon_key: string
    position: number
    is_active: boolean
  }>).map(normalizeCardLink)
}

function buildCommercialEntityRelations(
  entities: PublicCommercialEntityRow[],
  entity: PublicCommercialEntityRow,
): { parent: PublicCommercialEntityRelation | null; superior: PublicCommercialEntityRelation | null } {
  const byId = new Map(entities.map((item) => [item.id, item]))
  const parent = normalizeRelation(entity.parent_id ? byId.get(entity.parent_id) : null)
  const superior = normalizeRelation(parent?.id ? byId.get(byId.get(parent.id)?.parent_id || '') : null)
  return { parent, superior }
}

async function buildPublicCardData(
  entity: PublicCommercialEntityRow,
  entities: PublicCommercialEntityRow[],
  users: PublicCommercialUser[],
  companies: CommercialCompanyLinksProfile[],
  cardLinks: PublicCommercialCardLink[],
): Promise<PublicCommercialCardData> {
  const unit = String(entity.arw_data?.unidade || '').trim().toLowerCase()
  const company = unit ? companies.find((row) => String(row.nickname || '').trim().toLowerCase() === unit) || null : null
  const companyProfile = company ? normalizeCompanyProfile(company) : null
  const activeUsersMap = new Map(
    users.map((user) => [
      user.id,
      {
        id: user.id,
        name: user.name || null,
        avatar_url: user.avatar_url || null,
      },
    ]),
  )

  const { parent, superior } = await buildCommercialEntityRelations(entities, entity)

  return {
    entity,
    companyProfile,
    linkedUser: entity.user_id ? activeUsersMap.get(entity.user_id) || null : null,
    cardLinks,
    parent,
    superior,
  }
}

export async function getPublicCommercialCardBySlug(slug: string): Promise<PublicCommercialCardData | null> {
  const normalized = normalizeSlug(slug)
  if (!normalized) return null

  const admin = await createAdminClient()

  const entities = await fetchCommercialEntities(admin)
  const entity = entities.find(
    (row) => row.commercial_slug === normalized && isActiveStatus(row.status),
  )

  if (!entity) return null

  const [{ data: users, error: userError }, companies, cardLinks] = await Promise.all([
    admin
      .from('users')
      .select('id, name, avatar_url')
      .eq('active', true)
      .order('name'),
    fetchCompanyProfiles(admin),
    fetchCardLinks(admin),
  ])

  const normalizedUsers = ((users || []) as Array<{
    id: string
    name: string | null
    avatar_url: string | null
  }>).map((user) => ({
    id: user.id,
    name: user.name || null,
    avatar_url: user.avatar_url || null,
  }))

  if (userError) throw userError

  return buildPublicCardData(entity, entities, normalizedUsers, companies, cardLinks)
}

export async function getPublicCommercialPreviewCards(): Promise<PublicCommercialPreviewCard[]> {
  const admin = await createAdminClient()

  const [entities, usersResult, companies, cardLinks] = await Promise.all([
    fetchCommercialEntities(admin),
    admin
      .from('users')
      .select('id, name, avatar_url')
      .eq('active', true)
      .order('name'),
    fetchCompanyProfiles(admin),
    fetchCardLinks(admin),
  ])

  const { data: users, error: userError } = usersResult
  if (userError) throw userError

  const normalizedUsers = (users || []).map((user) => ({
    id: user.id,
    name: user.name || null,
    avatar_url: user.avatar_url || null,
  }))

  const activeEntities = entities.filter((entity) => isActiveStatus(entity.status))

  return Promise.all(
    activeEntities.map((entity) =>
      buildPublicCardData(
        entity,
        entities,
        normalizedUsers,
        companies,
        cardLinks,
      ),
    ),
  )
}
