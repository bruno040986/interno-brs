'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  decidePraise,
  getPraiseFeed,
  getReceivedPraiseRequests,
  markPraiseNotificationsRead,
  sendPraise,
  togglePraiseReaction,
  type PraiseFeedItem,
} from '@/app/(dashboard)/praises/actions'

type PraiseTab = 'feed' | 'send' | 'received'

type WorkspaceUser = {
  id: string
  name: string
  avatar_url: string | null
}

const REACTION_EMOJIS = ['👏', '❤️', '🎉', '😂', '👍']
const PICKER_EMOJIS = ['😀', '😁', '😂', '😊', '😍', '🥳', '🤩', '😎', '👍', '👏', '🙏', '❤️', '💛', '💚', '💙', '🎉', '🔥', '⭐', '💪', '🚀', '✨']

function getInitials(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || '?'
  const second = parts.length > 1 ? parts[1]?.[0] : ''
  return (first + second).toUpperCase()
}

function formatWhen(iso: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function PraiseBoard(props: { initialTab?: PraiseTab; focusPraiseId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<PraiseTab>(props.initialTab || 'feed')
  const [focusPraiseId, setFocusPraiseId] = useState<string | null>(null)

  const [users, setUsers] = useState<WorkspaceUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [feed, setFeed] = useState<PraiseFeedItem[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)

  const [requests, setRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const [message, setMessage] = useState<string>('')
  const [bgColor, setBgColor] = useState<string>('#FFF8C5')
  const [textColor, setTextColor] = useState<string>('#111827')
  const [recipientId, setRecipientId] = useState<string>('') // '' => todos
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const remaining = 150 - message.length

  const recipientOptions = useMemo(() => {
    return users
      .slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'))
      .map((u) => ({ value: u.id, label: u.name }))
  }, [users])

  useEffect(() => {
    if (!props.initialTab) return
    setActiveTab(props.initialTab)
    setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [props.initialTab])

  useEffect(() => {
    const pid = props.focusPraiseId ? String(props.focusPraiseId) : ''
    if (pid) {
      setFocusPraiseId(pid)
      setActiveTab('feed')
      setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [props.focusPraiseId])

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, active')
        .eq('active', true)
        .order('name', { ascending: true })
      if (error) throw error
      setUsers((data || []).map((u: any) => ({ id: u.id, name: u.name, avatar_url: u.avatar_url || null })))
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  async function loadFeed() {
    setLoadingFeed(true)
    const res = await getPraiseFeed({ limit: 60 })
    if (res.success) setFeed(res.feed || [])
    setLoadingFeed(false)
  }

  async function loadRequests() {
    setLoadingRequests(true)
    const res = await getReceivedPraiseRequests()
    if (res.success) setRequests(res.requests || [])
    setLoadingRequests(false)
  }

  useEffect(() => {
    loadUsers()
    loadFeed()
  }, [])

  useEffect(() => {
    if (activeTab !== 'feed') return
    if (!focusPraiseId) return
    const el = containerRef.current?.querySelector<HTMLElement>(`#praise-${CSS.escape(focusPraiseId)}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeTab, focusPraiseId, feed.length])

  useEffect(() => {
    if (activeTab === 'received') {
      loadRequests()
      markPraiseNotificationsRead().finally(() => window.dispatchEvent(new Event('praise:refresh')))
    }
  }, [activeTab])

  async function handleSend() {
    if (sending) return
    setFeedback(null)
    const text = message.trim()
    if (!text) {
      setFeedback({ type: 'error', text: 'Escreva uma mensagem antes de enviar.' })
      return
    }
    setSending(true)
    const res = await sendPraise({
      to_all: !recipientId,
      to_user_id: recipientId || null,
      message: text,
      bg_color: bgColor,
      text_color: textColor,
    })
    setSending(false)

    if (res.success) {
      setMessage('')
      setRecipientId('')
      setShowEmojiPicker(false)
      if (res.status === 'accepted') {
        setFeedback({ type: 'success', text: 'Elogio publicado no feed.' })
        setActiveTab('feed')
        await loadFeed()
      } else {
        setFeedback({ type: 'success', text: 'Elogio enviado e aguardando aceitação do destinatário.' })
        setActiveTab('send')
      }
      setTimeout(() => containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } else {
      setFeedback({ type: 'error', text: res.error || 'Falha ao enviar elogio.' })
    }
  }

  async function handleDecision(praiseId: string, decision: 'accept' | 'deny') {
    const res = await decidePraise({ praise_id: praiseId, decision })
    if (res.success) {
      await loadRequests()
      await loadFeed()
      setFeedback({
        type: 'success',
        text: decision === 'accept' ? 'Elogio aceito e publicado no feed.' : 'Elogio negado.',
      })
      window.dispatchEvent(new Event('praise:refresh'))
    }
  }

  async function handleToggleReaction(praiseId: string, emoji: string) {
    const res = await togglePraiseReaction({ praise_id: praiseId, emoji })
    if (res.success) await loadFeed()
  }

  return (
    <div ref={containerRef} className="widget-card" style={{ overflow: 'hidden' }}>
      <div className="widget-header">
        <h3 className="widget-title" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--brs-gold)', display: 'inline-block' }} />
          Mural de Elogios
        </h3>
      </div>

      <div className="tab-nav">
        <div className={`tab-button ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          Feed de Elogios
        </div>
        <div className={`tab-button ${activeTab === 'send' ? 'active' : ''}`} onClick={() => setActiveTab('send')}>
          Enviar Elogios
        </div>
        <div className={`tab-button ${activeTab === 'received' ? 'active' : ''}`} onClick={() => setActiveTab('received')}>
          Elogios Recebidos
        </div>
      </div>

      {activeTab === 'feed' && (
        <div className="widget-content" style={{ padding: '1rem', maxHeight: 460, overflowY: 'auto' }}>
          {loadingFeed ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--brs-gray-400)', fontSize: '0.8125rem' }}>Carregando elogios...</div>
          ) : feed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--brs-gray-400)', fontSize: '0.8125rem' }}>Nenhum elogio ainda.</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {feed.map((item) => (
                <div
                  key={item.id}
                  id={`praise-${item.id}`}
                  style={{
                    border: '1px solid var(--brs-gray-100)',
                    outline: focusPraiseId === item.id ? '2px solid var(--brs-gold)' : 'none',
                    borderRadius: 14,
                    padding: '0.85rem',
                    background: item.bg_color || '#FFF8C5',
                    color: item.text_color || '#111827',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div
                          title={item.from_user?.name}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: 'rgba(0,0,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {item.from_user?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.from_user.avatar_url} alt={item.from_user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            getInitials(item.from_user?.name || '?')
                          )}
                        </div>
                        {!item.to_all && item.to_user && (
                          <div
                            title={item.to_user.name}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              background: 'rgba(0,0,0,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {item.to_user.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.to_user.avatar_url} alt={item.to_user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              getInitials(item.to_user.name || '?')
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, opacity: 0.85 }}>
                          {item.to_all ? 'Para todos' : `Para ${item.to_user?.name?.split(' ')?.[0] || '—'}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{formatWhen(item.created_at)}</div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '0.55rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 6 as any,
                      WebkitBoxOrient: 'vertical' as any,
                      overflow: 'hidden',
                    }}
                    title={item.message}
                  >
                    {item.message}
                  </div>

                  <div style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                    {REACTION_EMOJIS.map((emoji) => {
                      const meta = item.reactions.find((r) => r.emoji === emoji)
                      const count = meta?.count || 0
                      const reacted = !!meta?.reacted
                      return (
                        <button
                          key={`${item.id}-${emoji}`}
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggleReaction(item.id, emoji)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 999,
                            borderColor: reacted ? 'var(--brs-navy)' : 'rgba(0,0,0,0.15)',
                            background: reacted ? 'rgba(27,58,107,0.08)' : 'rgba(255,255,255,0.4)',
                            color: item.text_color || '#111827',
                            fontWeight: 800,
                          }}
                          title="Reagir"
                        >
                          {emoji} {count > 0 ? count : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'send' && (
        <div className="widget-content" style={{ padding: '1rem' }}>
          {feedback && (
            <div
              style={{
                marginBottom: '0.75rem',
                padding: '0.75rem 0.9rem',
                borderRadius: 12,
                border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fecaca'}`,
                background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: feedback.type === 'success' ? '#166534' : '#991b1b',
                fontWeight: 800,
                fontSize: '0.85rem',
              }}
            >
              {feedback.text}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Destinatário</label>
            <select className="form-control" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} disabled={loadingUsers}>
              <option value="">Todos</option>
              {recipientOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0 }}>Mensagem (150 caracteres)</label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  title="Inserir emoji"
                >
                  😊 Emoji
                </button>
                {showEmojiPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '40px',
                      zIndex: 50,
                      width: 260,
                      background: '#fff',
                      border: '1px solid var(--brs-gray-100)',
                      borderRadius: 14,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                      padding: '0.6rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '0.35rem',
                    }}
                  >
                    {PICKER_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="btn btn-ghost"
                        style={{ borderRadius: 12, padding: '0.35rem', justifyContent: 'center' }}
                        onClick={() => {
                          setMessage((prev) => (prev.length >= 150 ? prev : `${prev}${e}`))
                          setShowEmojiPicker(false)
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <textarea
              className="form-control"
              value={message}
              maxLength={150}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva seu elogio… (você pode usar emojis e #hashtags)"
              style={{ minHeight: 90, resize: 'none' }}
            />
            <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: remaining < 0 ? 'var(--brs-danger)' : 'var(--brs-gray-400)' }}>
              Restam {Math.max(0, remaining)} caracteres
            </div>
          </div>

          <div className="form-grid form-grid-2" style={{ alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label">Cor do Post-it</label>
              <input className="form-control" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cor da Letra</label>
              <input className="form-control" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brs-gray-500)', marginBottom: '0.35rem' }}>Prévia</div>
            <div style={{ borderRadius: 14, padding: '0.85rem', border: '1px solid var(--brs-gray-100)', background: bgColor, color: textColor, fontWeight: 800 }}>
              {message.trim() ? message : 'Escreva sua mensagem…'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setMessage('')} disabled={sending || !message}>
              Limpar
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSend} disabled={sending || !message.trim()}>
              Enviar
            </button>
          </div>
        </div>
      )}

      {activeTab === 'received' && (
        <div className="widget-content" style={{ padding: '1rem', maxHeight: 520, overflowY: 'auto' }}>
          {loadingRequests ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--brs-gray-400)', fontSize: '0.8125rem' }}>Carregando…</div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--brs-gray-400)', fontSize: '0.8125rem' }}>Nenhum elogio pendente.</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {requests.map((req: any) => (
                <div key={req.id} className="card" style={{ padding: '0.85rem', border: '1px solid var(--brs-gray-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      <div
                        title={req.from_user?.name}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'var(--brs-navy)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {req.from_user?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={req.from_user.avatar_url} alt={req.from_user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          getInitials(req.from_user?.name || '?')
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brs-gray-800)' }}>Você recebeu um elogio!</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--brs-gray-400)' }}>{formatWhen(String(req.created_at || ''))}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button type="button" className="btn btn-outline" onClick={() => handleDecision(String(req.id), 'deny')}>
                        Negar
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => handleDecision(String(req.id), 'accept')}>
                        Aceitar
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.6rem', borderRadius: 14, padding: '0.85rem', background: String(req.bg_color || '#FFF8C5'), color: String(req.text_color || '#111827'), fontWeight: 800 }}>
                    {String(req.message || '')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
