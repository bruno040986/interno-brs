'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Send, Smile, Paperclip, Zap } from 'lucide-react'

interface ChatUser {
  id: string
  email: string
  full_name?: string
  avatar?: string
}

interface ChatMessage {
  id: string
  text: string
  timestamp: string
  sender: ChatUser
  attachments?: Array<{ id: string; name: string; url: string }>
}

interface ChatConversation {
  id: string
  participant: ChatUser
  lastMessage?: ChatMessage
  unreadCount: number
}

export function GoogleChatComponent() {
  const [activeTab, setActiveTab] = useState<'contatos' | 'conversas'>('contatos')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [showConversationView, setShowConversationView] = useState(false)
  
  // Estados da conversa
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  // Dados
  const [contacts, setContacts] = useState<ChatUser[]>([])
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkGoogleConnection()
  }, [])

  async function checkGoogleConnection() {
    try {
      const response = await fetch('/api/calendar/check-connection')
      const data = await response.json()
      setIsConnected(data.connected)
      if (data.connected) {
        fetchContacts()
        fetchConversations()
      }
    } catch (error) {
      console.error('Error checking connection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchContacts() {
    try {
      const response = await fetch('/api/users/list')
      const data = await response.json()
      setContacts(data)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  async function fetchConversations() {
    try {
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  async function loadMessages(conversationId: string) {
    setLoadingMessages(true)
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      const data = await response.json()
      setMessages(data)
      scrollToBottom()
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  async function sendMessage() {
    if (!messageText.trim() || !selectedConversation) return

    setIsSending(true)
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          text: messageText,
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages([...messages, newMessage])
        setMessageText('')
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleContactClick(contact: ChatUser) {
    // Procurar conversa existente ou criar nova
    const existingConv = conversations.find((c) => c.participant.id === contact.id)
    if (existingConv) {
      setSelectedConversation(existingConv)
      loadMessages(existingConv.id)
    } else {
      const newConv: ChatConversation = {
        id: `temp-${contact.id}`,
        participant: contact,
        unreadCount: 0,
      }
      setSelectedConversation(newConv)
      setMessages([])
    }
    setShowConversationView(true)
  }

  function handleConversationClick(conversation: ChatConversation) {
    setSelectedConversation(conversation)
    loadMessages(conversation.id)
    setShowConversationView(true)
  }

  const filteredContacts = contacts.filter((c) =>
    (c.full_name || c.email).toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const filteredConversations = conversations.filter((c) =>
    (c.participant.full_name || c.participant.email).toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">⏳ Carregando...</div>
  }

  if (!isConnected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-900">Conecte sua conta Google para usar o Google Chat</p>
      </div>
    )
  }

  if (showConversationView && selectedConversation) {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg">
        {/* Header da Conversa */}
        <div className="flex items-center justify-between border-b p-3">
          <button
            onClick={() => setShowConversationView(false)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Voltar
          </button>
          <h3 className="font-semibold flex-1 text-center">
            {selectedConversation.participant.full_name || selectedConversation.participant.email}
          </h3>
          <div className="w-8"></div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {loadingMessages ? (
            <div className="text-center py-4 text-gray-500 text-sm">Carregando mensagens...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhuma mensagem ainda. Seja o primeiro a escrever!</div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className="flex mb-2">
                  <div className="mr-2">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold">
                      {msg.sender.full_name?.[0] || msg.sender.email[0]}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold">{msg.sender.full_name || msg.sender.email}</span>
                      {' '}
                      <span className="text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded mt-1 text-sm">{msg.text}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input de Mensagem */}
        <div className="border-t p-3 space-y-2">
          {showEmojiPicker && (
            <div className="grid grid-cols-8 gap-1 p-2 bg-gray-100 rounded text-sm mb-2">
              {['😀', '😂', '❤️', '👍', '🎉', '🔥', '✨', '😍'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setMessageText(messageText + emoji)
                    setShowEmojiPicker(false)
                  }}
                  className="hover:bg-gray-200 p-1 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Escreva uma mensagem..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-2 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700"
              title="Emoji"
            >
              <Smile size={16} />
            </button>
            <button
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="px-2 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700"
              title="GIF"
            >
              <Zap size={16} />
            </button>
            <button
              className="px-2 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700"
              title="Arquivo"
            >
              <Paperclip size={16} />
            </button>
            <button
              onClick={sendMessage}
              disabled={!messageText.trim() || isSending}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      {/* Abas */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('contatos')}
          className={`px-3 py-2 font-medium text-sm ${
            activeTab === 'contatos'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Contatos
        </button>
        <button
          onClick={() => setActiveTab('conversas')}
          className={`px-3 py-2 font-medium text-sm ${
            activeTab === 'conversas'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          💬 Conversas
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white rounded-lg max-h-96 overflow-y-auto">
        {activeTab === 'contatos' && (
          <div className="space-y-1 p-2">
            {filteredContacts.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">Nenhum contato encontrado</p>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleContactClick(contact)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                >
                  <div className="font-medium">{contact.full_name || contact.email}</div>
                  <div className="text-xs text-gray-500">{contact.email}</div>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'conversas' && (
          <div className="space-y-1 p-2">
            {filteredConversations.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-sm">Nenhuma conversa</p>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm border-b"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{conv.participant.full_name || conv.participant.email}</div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">{conv.unreadCount}</span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-gray-600 truncate mt-1">{conv.lastMessage.text}</p>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
