'use client'

import { useState, useEffect } from 'react'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  attendees?: Array<{ email: string; displayName?: string }>
}

export function AgendaComponent() {
  const [activeTab, setActiveTab] = useState<'minha' | 'empresa'>('minha')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name?: string }>>([])

  useEffect(() => {
    checkGoogleConnection()
    fetchUsers()
  }, [])

  async function checkGoogleConnection() {
    try {
      const response = await fetch('/api/calendar/check-connection')
      const data = await response.json()
      setIsConnected(data.connected)
    } catch (error) {
      console.error('Error checking connection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users/list')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  async function handleConnectGoogle() {
    // Será implementado quando tivermos as credenciais
    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem('oauth_state', state)
    // window.location.href = generateGoogleAuthUrl(state)
  }

  async function fetchMyEvents() {
    // Será implementado quando tivermos os tokens
    setEvents([])
  }

  async function fetchUserEvents(userEmail: string) {
    // Será implementado quando tivermos os tokens
    setEvents([])
  }

  useEffect(() => {
    if (activeTab === 'minha' && isConnected) {
      fetchMyEvents()
    }
  }, [activeTab, isConnected])

  useEffect(() => {
    if (activeTab === 'empresa' && selectedUser) {
      fetchUserEvents(selectedUser)
    }
  }, [selectedUser, activeTab])

  return (
    <div className="w-full space-y-4">
      {/* Abas */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('minha')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'minha'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Minha Agenda
        </button>
        <button
          onClick={() => setActiveTab('empresa')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'empresa'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Agenda da Empresa
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white rounded-lg p-6">
        {/* Aba: Minha Agenda */}
        {activeTab === 'minha' && (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-gray-500">⏳ Verificando conexão...</p>
            ) : !isConnected ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-900 mb-3">Conecte sua conta Google para visualizar sua agenda</p>
                <button
                  onClick={handleConnectGoogle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  🔗 Conectar Google
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Seus Compromissos</h3>
                  <button className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                    ➕ Novo Compromisso
                  </button>
                </div>

                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum compromisso para hoje</p>
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div key={event.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.start}</p>
                        {event.attendees && event.attendees.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            👥 {event.attendees.map((a) => a.displayName || a.email).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Aba: Agenda da Empresa */}
        {activeTab === 'empresa' && (
          <div className="space-y-4">
            {!isConnected ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-900">Você precisa conectar sua conta Google primeiro</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Selecione um usuário:</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Escolha um usuário --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUser && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Agenda de {selectedUser}</h3>
                    {events.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhum compromisso para exibir</p>
                    ) : (
                      <div className="space-y-2">
                        {events.map((event) => (
                          <div key={event.id} className="border rounded-lg p-3 hover:bg-gray-50 bg-gray-50">
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-gray-600">{event.start}</p>
                            {event.description && (
                              <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
