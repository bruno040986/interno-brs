'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EllipsisVertical, MessageSquareText, Paperclip, Search, Send, Users } from 'lucide-react'

type MoodKey = 'very_happy' | 'well' | 'thinking' | 'tired' | 'irritated' | 'down'
type ChatStatus = 'online' | 'offline' | 'busy' | 'away'

type Contact = {
  id: string
  email: string
  full_name?: string
  short_name?: string
  avatar_url?: string | null
  nickname?: string | null
  status?: ChatStatus
  mood?: MoodKey | null
  status_message?: string | null
}

type ChatMessage = {
  id: string
  text: string
  timestamp: string
  sender: {
    id: string
    email: string
    full_name?: string
  }
  text_style?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    bgColor?: string
  } | null
  attachments?: Array<{ name?: string; url?: string; size?: number; type?: string }>
  delivery_status?: 'sending' | 'sent' | 'read' | null
}

type Conversation = {
  id: string
  participant: Contact
  lastMessage?: ChatMessage
  unreadCount: number
}

type MyProfile = {
  user: { id: string; name?: string; email?: string; avatar_url?: string | null } | null
  profile: {
    nickname?: string | null
    status?: ChatStatus
    mood?: MoodKey | null
    mood_date?: string | null
    status_message?: string | null
  } | null
}

type MessengerToast = {
  id: string
  text: string
}

const moods: Array<{ key: MoodKey; label: string }> = [
  { key: 'very_happy', label: 'Muito Feliz' },
  { key: 'well', label: 'Bem' },
  { key: 'thinking', label: 'Pensativo' },
  { key: 'tired', label: 'Cansado' },
  { key: 'irritated', label: 'Irritado' },
  { key: 'down', label: 'Desanimado' },
]

const moodEmoji: Record<MoodKey, string> = {
  very_happy: '🌟',
  well: '🙂',
  thinking: '😐',
  tired: '🥱',
  irritated: '😒',
  down: '😢',
}

const statusIcon: Record<ChatStatus, string> = {
  online: '🟢',
  offline: '⚪',
  busy: '⛔',
  away: '🚫',
}

const bgPalette = ['#fef3c7', '#dbeafe', '#dcfce7', '#fee2e2', '#f3e8ff', '#ffffff']

function formatName(label?: string | null) {
  if (!label) return ''
  const parts = label.trim().split(' ').filter(Boolean)
  return parts.slice(0, 2).join(' ')
}

function hasGlobalMessengerNotifier() {
  if (typeof window === 'undefined') return false
  return Boolean((window as Window & { __BRS_MESSENGER_GLOBAL_NOTIFIER__?: boolean }).__BRS_MESSENGER_GLOBAL_NOTIFIER__)
}

export function GoogleChatComponent() {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [text, setText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; url: string; size: number; type: string }>>([])
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null)
  const [myProfile, setMyProfile] = useState<MyProfile>({ user: null, profile: null })
  const [nickname, setNickname] = useState('')
  const [status, setStatus] = useState<ChatStatus>('online')
  const [mood, setMood] = useState<MoodKey | ''>('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [style, setStyle] = useState<{ bold: boolean; italic: boolean; underline: boolean; bgColor: string }>({
    bold: false,
    italic: false,
    underline: false,
    bgColor: '#ffffff',
  })
  const [popupToasts, setPopupToasts] = useState<MessengerToast[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const heartbeatRef = useRef<number | null>(null)
  const conversationPollRef = useRef<number | null>(null)
  const messagesPollRef = useRef<number | null>(null)
  const contactsPollRef = useRef<number | null>(null)
  const activeTabRef = useRef<1 | 2 | 3>(1)
  const selectedConversationIdRef = useRef<string | null>(null)
  const initializedContactsRef = useRef(false)
  const initializedConversationsRef = useRef(false)
  const lastContactStatusRef = useRef<Record<string, ChatStatus>>({})
  const lastUnreadByConversationRef = useRef<Record<string, number>>({})
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    bootstrap()
    return () => {
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current)
      if (conversationPollRef.current) window.clearInterval(conversationPollRef.current)
      if (messagesPollRef.current) window.clearInterval(messagesPollRef.current)
      if (contactsPollRef.current) window.clearInterval(contactsPollRef.current)
    }
  }, [])

  useEffect(() => {
    const updateTheme = () => {
      const current = document.documentElement.getAttribute('data-theme')
      setIsDarkTheme(current === 'dark')
    }

    updateTheme()
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id || null
  }, [selectedConversation?.id])

  useEffect(() => {
    const onScrollToBottom = () => {
      if (!selectedConversation) return
      stickToBottomRef.current = true
      setActiveTab(3)
      window.setTimeout(() => {
        scrollMessagesToBottom('smooth')
      }, 50)
    }

    window.addEventListener('brs-messenger:scroll-to-bottom', onScrollToBottom as EventListener)
    return () => window.removeEventListener('brs-messenger:scroll-to-bottom', onScrollToBottom as EventListener)
  }, [selectedConversation])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const updateStickiness = () => {
      stickToBottomRef.current = isNearBottom(container)
    }

    updateStickiness()
    container.addEventListener('scroll', updateStickiness, { passive: true })
    return () => container.removeEventListener('scroll', updateStickiness)
  }, [selectedConversation?.id, activeTab])

  useEffect(() => {
    if (conversationPollRef.current) window.clearInterval(conversationPollRef.current)
    conversationPollRef.current = window.setInterval(() => void fetchConversations(), 3000)
    return () => {
      if (conversationPollRef.current) window.clearInterval(conversationPollRef.current)
    }
  }, [])

  useEffect(() => {
    if (contactsPollRef.current) window.clearInterval(contactsPollRef.current)
    contactsPollRef.current = window.setInterval(() => void fetchContacts(), 4000)
    return () => {
      if (contactsPollRef.current) window.clearInterval(contactsPollRef.current)
    }
  }, [])

  useEffect(() => {
    if (messagesPollRef.current) window.clearInterval(messagesPollRef.current)
    if (!selectedConversation) return
    messagesPollRef.current = window.setInterval(() => {
      void loadMessages(selectedConversation.id, true)
    }, 2000)
    return () => {
      if (messagesPollRef.current) window.clearInterval(messagesPollRef.current)
    }
  }, [selectedConversation?.id])

  async function bootstrap() {
    setIsLoading(true)
    await Promise.all([fetchMyProfile(), fetchContacts(), fetchConversations()])
    await heartbeat()
    heartbeatRef.current = window.setInterval(() => void heartbeat(), 60000)
    setIsLoading(false)
  }

  async function fetchMyProfile() {
    const response = await fetch('/api/chat/profile')
    const data = await response.json()
    if (!response.ok) return
    setMyProfile(data)
    setNickname(data.profile?.nickname || '')
    setStatus(data.profile?.status || 'online')
    const today = new Date().toISOString().slice(0, 10)
    const currentMood = data.profile?.mood && data.profile?.mood_date === today ? data.profile.mood : ''
    setMood(currentMood || '')
    setStatusMessage(data.profile?.status_message || '')
  }

  async function heartbeat() {
    await fetch('/api/chat/presence', { method: 'POST' })
  }

  async function fetchContacts() {
    const response = await fetch('/api/chat/contacts')
    const data = await response.json()
    const nextContacts = Array.isArray(data) ? (data as Contact[]) : []

    if (initializedContactsRef.current) {
      const previous = lastContactStatusRef.current
      for (const contact of nextContacts) {
        const prevStatus = previous[contact.id] || 'offline'
        const nextStatus = (contact.status || 'offline') as ChatStatus
        if (prevStatus === 'offline' && nextStatus !== 'offline') {
          const label = contact.nickname || contact.short_name || formatName(contact.full_name) || contact.email
          if (!hasGlobalMessengerNotifier()) {
            pushToast(`${label} acabou de entrar.`)
          }
        }
      }
    }

    const statusMap: Record<string, ChatStatus> = {}
    for (const c of nextContacts) {
      statusMap[c.id] = (c.status || 'offline') as ChatStatus
    }
    lastContactStatusRef.current = statusMap
    initializedContactsRef.current = true
    setContacts(nextContacts)
  }

  async function fetchConversations() {
    const response = await fetch('/api/chat/conversations')
    const data = await response.json()
    const nextConversations = Array.isArray(data) ? (data as Conversation[]) : []

    if (initializedConversationsRef.current) {
      const previousUnread = lastUnreadByConversationRef.current
      for (const conv of nextConversations) {
        const prev = previousUnread[conv.id] || 0
        const next = conv.unreadCount || 0
        const hasNewUnread = next > prev
        if (!hasNewUnread) continue

        const isCurrentChatOpen =
          activeTabRef.current === 3 &&
          selectedConversationIdRef.current === conv.id &&
          !document.hidden

        if (!isCurrentChatOpen && !hasGlobalMessengerNotifier()) {
          const label =
            conv.participant.nickname ||
            conv.participant.short_name ||
            formatName(conv.participant.full_name) ||
            conv.participant.email
          pushToast(`${label} te enviou uma mensagem.`)
        }
      }
    }

    const unreadMap: Record<string, number> = {}
    for (const conv of nextConversations) {
      unreadMap[conv.id] = conv.unreadCount || 0
    }
    lastUnreadByConversationRef.current = unreadMap
    initializedConversationsRef.current = true
    setConversations(nextConversations)
  }

  function pushToast(text: string) {
    if (hasGlobalMessengerNotifier()) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setPopupToasts((prev) => {
      const next = [...prev, { id, text }]
      return next.slice(-4)
    })
    window.setTimeout(() => {
      setPopupToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4800)
  }

  async function saveProfile() {
    await fetch('/api/chat/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: nickname || null,
        status,
        mood: mood || null,
        status_message: statusMessage || null,
      }),
    })
    await Promise.all([fetchMyProfile(), fetchContacts(), fetchConversations()])
  }

  async function openConversation(contact: Contact) {
    let conversation = conversations.find((c) => c.participant.id === contact.id) || null
    if (!conversation) {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: contact.id }),
      })
      const data = await response.json()
      if (!response.ok || !data?.id) return
      await fetchConversations()
      conversation = {
        id: data.id,
        participant: contact,
        unreadCount: 0,
      }
    }
    setSelectedConversation(conversation)
    setActiveTab(3)
    stickToBottomRef.current = true
    await loadMessages(conversation.id)
  }

  async function loadMessages(conversationId: string, silent = false) {
    if (!silent) setLoadingMessages(true)
    const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
    const data = await response.json()
    if (Array.isArray(data)) {
      setMessages(data)
    }
    if (!silent) setLoadingMessages(false)
    const shouldStickToBottom = !silent || stickToBottomRef.current
    if (shouldStickToBottom) {
      setTimeout(() => {
        scrollMessagesToBottom('auto')
      }, 50)
    }
    await fetchConversations()
  }

  async function sendMessage() {
    if (!selectedConversation) return
    if (!text.trim() && attachedFiles.length === 0) return
    const optimisticId = `temp-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      text: text.trim() || '[Arquivo]',
      timestamp: new Date().toISOString(),
      sender: {
        id: myProfile.user?.id || 'me',
        email: myProfile.user?.email || '',
        full_name: myProfile.user?.name,
      },
      text_style: style,
      attachments: attachedFiles,
      delivery_status: 'sending',
    }
    setMessages((prev) => [...prev, optimisticMessage])
    setIsSending(true)
    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedConversation.id,
        text: text.trim() || '[Arquivo]',
        textStyle: style,
        attachments: attachedFiles,
      }),
    })
    const data = await response.json()
    setIsSending(false)
    if (!response.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      return
    }
    setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data : m)))
    setText('')
    setAttachedFiles([])
    stickToBottomRef.current = true
    setTimeout(() => {
      scrollMessagesToBottom('auto')
    }, 50)
    await fetchConversations()
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isSending && (text.trim() || attachedFiles.length > 0)) {
        void sendMessage()
      }
    }
  }

  async function onPickFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    for (const file of Array.from(fileList)) {
      if (file.size > 15 * 1024 * 1024) {
        alert(`Arquivo ${file.name} excede 15MB.`)
        continue
      }
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/chat/upload', { method: 'POST', body: form })
      const uploaded = await response.json()
      if (response.ok) {
        setAttachedFiles((prev) => [...prev, uploaded])
      }
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items
    const files: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    if (files.length > 0) {
      e.preventDefault()
      const dt = new DataTransfer()
      files.forEach((f) => dt.items.add(f))
      void onPickFile(dt.files)
    }
  }

  function isNearBottom(container: HTMLDivElement) {
    const threshold = 120
    return container.scrollHeight - (container.scrollTop + container.clientHeight) < threshold
  }

  function scrollMessagesToBottom(behavior: ScrollBehavior = 'auto') {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    })
    stickToBottomRef.current = true
  }

  async function deleteConversation(id: string) {
    // soft local removal (historico na base pode ser mantido)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (selectedConversation?.id === id) {
      setSelectedConversation(null)
      setMessages([])
      setActiveTab(2)
    }
  }

  const onlineContacts = useMemo(
    () => contacts.filter((c) => (c.status || 'offline') !== 'offline' && `${c.nickname || c.short_name || c.full_name || c.email}`.toLowerCase().includes(search.toLowerCase())),
    [contacts, search],
  )
  const offlineContacts = useMemo(
    () => contacts.filter((c) => (c.status || 'offline') === 'offline' && `${c.nickname || c.short_name || c.full_name || c.email}`.toLowerCase().includes(search.toLowerCase())),
    [contacts, search],
  )
  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) =>
        `${c.participant.nickname || c.participant.short_name || c.participant.full_name || c.participant.email}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [conversations, search],
  )

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  const myNameDefault = formatName(myProfile.user?.name || myProfile.user?.email || '')
  const myNameDisplay = nickname || myNameDefault
  const today = new Date().toISOString().slice(0, 10)
  const hasMoodToday = Boolean(myProfile.profile?.mood && myProfile.profile?.mood_date === today)

  if (isLoading) return <div className="text-sm text-gray-500 py-4">Carregando BRS Messenger...</div>

  return (
    <div
      className="brs-messenger rounded-md overflow-hidden"
      style={{
        border: '1px solid #7aa9c2',
        boxShadow: 'inset 0 0 0 1px #cde9f7',
        background: 'linear-gradient(180deg,#d9f2ff 0%,#b7e7fb 25%,#ffffff 25%,#ffffff 100%)',
        fontFamily: 'Tahoma, Arial, sans-serif',
      }}
    >
      <div
        className="px-3 py-2 border-b flex items-center justify-between"
        style={
          isDarkTheme
            ? { background: 'linear-gradient(180deg,#1d4f73,#163f61)', borderBottomColor: '#2f5f83' }
            : { background: 'linear-gradient(180deg,#9fdef9,#74c8ec)', borderBottomColor: '#6fb5d5' }
        }
      >
        <div className="text-sm font-semibold tracking-tight" style={{ color: isDarkTheme ? '#eaf6ff' : '#1e293b' }}>
          BRS Messenger
        </div>
        <div className="text-xs text-slate-700">{statusIcon[status]}</div>
      </div>

      <div className="px-2 py-2 border-b brs-messenger-surface">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Localizar contato..."
            className="w-full pl-7 pr-2 py-1.5 text-xs border rounded"
          />
        </div>
      </div>

      <div className="flex border-b bg-slate-50 text-xs" style={{ borderBottomColor: '#bdd9e8' }}>
        <button
          className={`px-3 py-2 border-r ${activeTab === 1 ? 'bg-white font-semibold' : ''}`}
          style={{ borderRightColor: '#d4e5ef' }}
          onClick={() => setActiveTab(1)}
        >
          👥 Perfil e Contatos
        </button>
        <button
          className={`px-3 py-2 border-r relative ${activeTab === 2 ? 'bg-white font-semibold' : ''}`}
          style={{ borderRightColor: '#d4e5ef' }}
          onClick={() => setActiveTab(2)}
        >
          💬 Conversas
          {unreadTotal > 0 && <span className="ml-1 inline-flex min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] items-center justify-center">{unreadTotal}</span>}
        </button>
        <button className={`px-3 py-2 ${activeTab === 3 ? 'bg-white font-semibold' : ''}`} onClick={() => setActiveTab(3)} disabled={!selectedConversation}>
          🗨 Chat
        </button>
      </div>

      <div style={{ height: 460 }} className="brs-messenger-body">
        {activeTab === 1 && (
          <div className="p-2 space-y-3 text-xs h-full overflow-y-auto">
            <div className="border rounded p-2 bg-sky-50" style={{ borderColor: '#b7d8ea' }}>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden flex items-center justify-center text-sm font-bold">
                  {myProfile.user?.avatar_url ? <img src={myProfile.user.avatar_url} alt={myNameDefault} className="w-full h-full object-cover" /> : myNameDefault.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{myNameDisplay}</div>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, 40))}
                    placeholder="Nickname do Messenger"
                    className="mt-1 w-full border rounded px-1 py-1 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <select value={status} onChange={(e) => setStatus(e.target.value as ChatStatus)} className="border rounded px-1 py-1">
                  <option value="online">Online</option>
                  <option value="busy">Ocupado</option>
                  <option value="away">Ausente</option>
                </select>
                <select value={mood} onChange={(e) => setMood(e.target.value as MoodKey | '')} className="border rounded px-1 py-1">
                  <option value="">{hasMoodToday ? 'Humor de hoje' : 'Humor do Dia'}</option>
                  {moods.map((m) => (
                    <option key={m.key} value={m.key}>
                      {moodEmoji[m.key]} {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value.slice(0, 50))}
                placeholder="Mensagem de status (max 50)"
                className="mt-2 w-full border rounded px-1 py-1"
              />
              <button onClick={saveProfile} className="mt-2 w-full py-1 rounded bg-blue-600 text-white">
                Salvar Perfil
              </button>
            </div>

            <div className="border rounded">
              <div className="px-2 py-1.5 bg-green-50 font-semibold">Online ({onlineContacts.length})</div>
              <div>
                {onlineContacts.map((c) => (
                  <button
                    key={c.id}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void openConversation(c)
                    }}
                    className="w-full text-left px-2 py-1.5 brs-messenger-item border-b"
                  >
                    <span>{statusIcon[(c.status as ChatStatus) || 'online']}</span>{' '}
                    <span className="font-medium">{c.nickname || c.short_name || formatName(c.full_name) || c.email}</span>
                    {c.status === 'busy' ? ' ⛔' : c.status === 'away' ? ' 🚫' : ''}
                    {c.status_message ? <span className="text-gray-500"> - {c.status_message}</span> : null}
                  </button>
                ))}
                {onlineContacts.length === 0 && <div className="px-2 py-2 text-gray-500">Sem contatos online.</div>}
              </div>
            </div>

            <div className="border rounded">
              <div className="px-2 py-1.5 bg-slate-100 font-semibold">Offline ({offlineContacts.length})</div>
              <div>
                {offlineContacts.map((c) => (
                  <button
                    key={c.id}
                    onDoubleClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void openConversation(c)
                    }}
                    className="w-full text-left px-2 py-1.5 brs-messenger-item border-b"
                  >
                    <span>{statusIcon.offline}</span>{' '}
                    <span className="text-gray-600">{c.nickname || c.short_name || formatName(c.full_name) || c.email}</span>
                  </button>
                ))}
                {offlineContacts.length === 0 && <div className="px-2 py-2 text-gray-500">Sem contatos offline.</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="p-2 space-y-2 h-full overflow-y-auto">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onDoubleClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void openConversation(conv.participant)
                }}
                className="border rounded p-2 brs-messenger-item"
                style={{ borderColor: '#d6e4ec' }}
              >
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden flex items-center justify-center text-sm font-bold">
                    {conv.participant.avatar_url ? (
                      <img src={conv.participant.avatar_url} alt={conv.participant.full_name || conv.participant.email} className="w-full h-full object-cover" />
                    ) : (
                      (conv.participant.nickname || conv.participant.short_name || conv.participant.full_name || conv.participant.email || '?').charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-semibold truncate">
                        {conv.participant.nickname || conv.participant.short_name || formatName(conv.participant.full_name) || conv.participant.email}
                      </p>
                      <div className="relative">
                        <button onClick={() => setMenuConversationId(menuConversationId === conv.id ? null : conv.id)} className="text-gray-500 hover:text-gray-700">
                          <EllipsisVertical size={14} />
                        </button>
                        {menuConversationId === conv.id && (
                          <div className="absolute right-0 top-5 brs-messenger-menu border rounded shadow z-10">
                            <button
                              className="block px-3 py-1.5 text-xs hover:bg-slate-100 w-full text-left"
                              onClick={() => {
                                setMenuConversationId(null)
                                void openConversation(conv.participant)
                              }}
                            >
                              Abrir Conversa
                            </button>
                            <button
                              className="block px-3 py-1.5 text-xs hover:bg-slate-100 w-full text-left text-red-700"
                              onClick={() => {
                                setMenuConversationId(null)
                                void deleteConversation(conv.id)
                              }}
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.text || 'Sem mensagens ainda.'}</p>
                  </div>
                  {conv.unreadCount > 0 ? <span className="bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5">{conv.unreadCount}</span> : null}
                </div>
              </div>
            ))}
            {filteredConversations.length === 0 && <div className="text-xs text-gray-500 p-2">Nenhuma conversa.</div>}
          </div>
        )}

        {activeTab === 3 && (
          <div className="h-full flex flex-col min-h-0">
            {!selectedConversation ? (
              <div className="p-4 text-sm text-gray-500">Abra uma conversa pela aba de Contatos ou Conversas.</div>
            ) : (
              <>
                <div className="px-3 py-2 border-b brs-messenger-chat-head text-sm font-semibold flex items-center gap-2">
                  <MessageSquareText size={14} />
                  {selectedConversation.participant.nickname || selectedConversation.participant.short_name || formatName(selectedConversation.participant.full_name) || selectedConversation.participant.email}
                </div>
                <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-3 brs-messenger-chat-scroll">
                  {loadingMessages ? (
                    <div className="text-xs text-gray-500">Carregando mensagens...</div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((m) => {
                        const mine = m.sender.id === myProfile.user?.id
                        const customBg = m.text_style?.bgColor && m.text_style.bgColor !== '#ffffff'
                        const bgColor = customBg ? (m.text_style?.bgColor as string) : mine ? '#1e3a8a' : '#bfdbfe'
                        const textColor = customBg ? '#0f172a' : mine ? '#ffffff' : '#0f172a'
                        return (
                          <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className="max-w-[82%] rounded px-2 py-1.5 text-xs border"
                              style={{ background: bgColor, color: textColor, borderColor: mine ? '#1e3a8a' : '#93c5fd' }}
                            >
                              <div
                                style={{
                                  fontWeight: m.text_style?.bold ? 700 : 400,
                                  fontStyle: m.text_style?.italic ? 'italic' : 'normal',
                                  textDecoration: m.text_style?.underline ? 'underline' : 'none',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {m.text}
                              </div>
                              {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {m.attachments.map((a, idx) => (
                                    <a key={`${m.id}-att-${idx}`} href={a.url || '#'} target="_blank" className="block text-[11px] text-blue-700 underline">
                                      📎 {a.name || 'anexo'}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <div className="mt-1 text-[10px] text-gray-500">
                                {new Date(m.timestamp).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                {mine ? (
                                  <>
                                    {' '}
                                    {m.delivery_status === 'sending'
                                      ? '⏱️ enviando'
                                      : m.delivery_status === 'read'
                                        ? '✔️✔️ lido'
                                        : '✔️ enviado'}
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                <div className="border-t p-2 brs-messenger-editor space-y-2">
                  <div className="flex items-center gap-1">
                    <button className={`px-2 py-1 text-xs border rounded ${style.bold ? 'bg-slate-200' : ''}`} onClick={() => setStyle((s) => ({ ...s, bold: !s.bold }))}>
                      B
                    </button>
                    <button className={`px-2 py-1 text-xs border rounded ${style.italic ? 'bg-slate-200' : ''}`} onClick={() => setStyle((s) => ({ ...s, italic: !s.italic }))}>
                      I
                    </button>
                    <button className={`px-2 py-1 text-xs border rounded ${style.underline ? 'bg-slate-200' : ''}`} onClick={() => setStyle((s) => ({ ...s, underline: !s.underline }))}>
                      U
                    </button>
                    <select
                      className="text-xs border rounded px-1 py-1 w-[116px]"
                      value={style.bgColor}
                      onChange={(e) => setStyle((s) => ({ ...s, bgColor: e.target.value }))}
                      title="Cor de fundo"
                    >
                      {bgPalette.map((c) => (
                        <option
                          key={c}
                          value={c}
                          style={{ backgroundColor: c, color: '#0f172a' }}
                        >
                          {'Cor de Fundo'}
                        </option>
                      ))}
                    </select>
                    <label className="px-2 py-1 text-xs border rounded cursor-pointer flex items-center justify-center" title="Enviar arquivo">
                      <Paperclip size={12} />
                      <input type="file" className="hidden" onChange={(e) => void onPickFile(e.target.files)} />
                    </label>
                  </div>
                  {attachedFiles.length > 0 && (
                    <div className="text-[11px] text-gray-600">
                      {attachedFiles.map((f, i) => (
                        <div key={`${f.url}-${i}`}>📎 {f.name}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onPaste={onPaste}
                      onKeyDown={onComposerKeyDown}
                      className="flex-1 border rounded px-2 py-1.5 text-xs min-h-[54px]"
                      placeholder="Digite sua mensagem, cole texto ou imagem..."
                    />
                    <button onClick={sendMessage} disabled={isSending || (!text.trim() && attachedFiles.length === 0)} className="px-3 rounded bg-blue-600 text-white disabled:bg-gray-400">
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="brs-messenger-toast-stack" aria-live="polite">
        {popupToasts.map((toast) => (
          <div key={toast.id} className="brs-messenger-toast-item">
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  )
}
