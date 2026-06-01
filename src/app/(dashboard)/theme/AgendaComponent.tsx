'use client'

import { useState, useEffect } from 'react'
import type { CalendarEvent } from '@/lib/google/calendar'
import { CreateEventModal } from './CreateEventModal'

type ConnectionState = {
  connected: boolean
  reason?: string
}

export function AgendaComponent() {
  const [activeTab, setActiveTab] = useState<'minha' | 'empresa'>('minha')
  const [connection, setConnection] = useState<ConnectionState>({ connected: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      setConnection({
        connected: Boolean(data.connected),
        reason: typeof data.reason === 'string' ? data.reason : undefined,
      })
    } catch (error) {
      console.error('Error checking connection:', error)
      setConnection({ connected: false, reason: 'network_error' })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users/list')
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
  }

  async function handleConnectGoogle() {
    try {
      const response = await fetch('/api/auth/google/url')
      const data = await response.json()

      if (!response.ok || !data?.authUrl) {
        alert(`Erro ao conectar Google: ${data?.error || 'Falha desconhecida'}`)
        return
      }

      window.location.href = data.authUrl
    } catch (error) {
      console.error('Error during Google connection:', error)
      alert('Erro ao conectar ao Google. Verifique as credenciais na configuracao.')
    }
  }

  async function fetchMyEvents() {
    setIsLoadingEvents(true)
    try {
      const response = await fetch('/api/calendar/events')
      const data = await response.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }

  async function fetchUserEvents(userEmail: string) {
    setIsLoadingEvents(true)
    try {
      const response = await fetch(`/api/calendar/events?user=${encodeURIComponent(userEmail)}`)
      const data = await response.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching user events:', error)
      setEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'minha' && connection.connected) fetchMyEvents()
  }, [activeTab, connection.connected])

  useEffect(() => {
    if (activeTab === 'empresa' && selectedUser) fetchUserEvents(selectedUser)
  }, [selectedUser, activeTab])

  const connectionHint =
    connection.reason === 'token_invalid'
      ? 'Conexao expirada. Reconecte sua conta Google.'
      : 'Conecte sua conta Google para visualizar sua agenda.'

  return (
    <div className="w-full space-y-4">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('minha')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'minha' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Minha Agenda
        </button>
        <button
          onClick={() => setActiveTab('empresa')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'empresa' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Agenda da Empresa
        </button>
      </div>

      <div className="bg-white rounded-lg p-6">
        {activeTab === 'minha' && (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-gray-500">Verificando conexao...</p>
            ) : !connection.connected ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-900 mb-3">{connectionHint}</p>
                <button onClick={handleConnectGoogle} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Conectar Google
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Seus compromissos</h3>
                  <button onClick={() => setIsModalOpen(true)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                    Novo Compromisso
                  </button>
                </div>

                {isLoadingEvents ? (
                  <p className="text-gray-500 text-center py-8">Carregando eventos...</p>
                ) : events.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum compromisso para hoje.</p>
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div key={event.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(event.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'empresa' && (
          <div className="space-y-4">
            {!connection.connected ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-900">Voce precisa conectar sua conta Google primeiro.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Selecione um usuario:</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Escolha um usuario --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchMyEvents()}
        attendeeEmails={Array.isArray(users) ? users.map((u) => u.email) : []}
      />
    </div>
  )
}
