export type ChatStatus = 'online' | 'offline' | 'busy' | 'away'

export type ChatPresenceRecord = {
  status?: string | null
  last_seen_at?: string | null
  last_interaction_at?: string | null
  is_visible?: boolean | null
  has_focus?: boolean | null
}

export const OFFLINE_AFTER_MS = 2 * 60 * 60 * 1000
export const HEARTBEAT_RECENT_MS = 3 * 60 * 1000
export const INTERACTION_RECENT_MS = 5 * 60 * 1000

function toTime(value?: string | null) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

export function normalizeManualStatus(status?: string | null) {
  return status === 'busy' ? 'busy' : 'online'
}

export function deriveChatStatus(profile?: ChatPresenceRecord | null, now = Date.now()): ChatStatus {
  if (!profile) return 'offline'

  const lastSeenAt = toTime(profile.last_seen_at)
  if (!lastSeenAt || now - lastSeenAt > OFFLINE_AFTER_MS) {
    return 'offline'
  }

  if (normalizeManualStatus(profile.status) === 'busy') {
    return 'busy'
  }

  const heartbeatRecent = now - lastSeenAt <= HEARTBEAT_RECENT_MS
  const interactionAt = toTime(profile.last_interaction_at) ?? lastSeenAt
  const interactionRecent = interactionAt ? now - interactionAt <= INTERACTION_RECENT_MS : false
  const visible = profile.is_visible ?? true
  const focused = profile.has_focus ?? true

  if (heartbeatRecent && interactionRecent && visible && focused) {
    return 'online'
  }

  return 'away'
}

