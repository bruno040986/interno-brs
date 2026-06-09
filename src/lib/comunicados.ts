export type ComunicadoStatusDb = 'ativo' | 'inativo'
export type ComunicadoStatusView = 'ativo' | 'inativo' | 'agendado' | 'expirado'

export type ComunicadoProfile = {
  id: string
  name: string
}

export type ComunicadoTargetUser = {
  id: string
  name: string
  avatar_url?: string | null
  profile_id?: string | null
}

export type ComunicadoRow = {
  id: string
  titulo: string
  texto_html: string
  fixo_topo: boolean
  data_inicio_veiculacao: string
  data_fim_veiculacao: string
  status: ComunicadoStatusDb
  created_at: string
  updated_at: string
  created_by?: string | null
}

export type ComunicadoAdminItem = ComunicadoRow & {
  target_profiles: ComunicadoProfile[]
  target_users: ComunicadoTargetUser[]
  viewed_users: ComunicadoTargetUser[]
  pending_users: ComunicadoTargetUser[]
  target_count: number
  viewed_count: number
  pending_count: number
  status_view: ComunicadoStatusView
}

export type ComunicadoBoardItem = ComunicadoRow & {
  has_read: boolean
  is_visible_now: boolean
}

function parseDate(value: string) {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

export function getComunicadoStatusView(
  comunicado: Pick<ComunicadoRow, 'status' | 'data_inicio_veiculacao' | 'data_fim_veiculacao'>,
  now = Date.now(),
): ComunicadoStatusView {
  if (comunicado.status === 'inativo') return 'inativo'

  const start = parseDate(comunicado.data_inicio_veiculacao)
  const end = parseDate(comunicado.data_fim_veiculacao)

  if (!start || !end) return 'agendado'
  if (now < start) return 'agendado'
  if (now > end) return 'expirado'
  return 'ativo'
}

export function isComunicadoVisibleNow(
  comunicado: Pick<ComunicadoRow, 'status' | 'data_inicio_veiculacao' | 'data_fim_veiculacao'>,
  now = Date.now(),
) {
  return getComunicadoStatusView(comunicado, now) === 'ativo'
}

export function stripHtml(html: string) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getPlainTextLength(html: string) {
  return stripHtml(html).length
}

export function formatDateTimeBR(iso: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDateBR(iso: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}

