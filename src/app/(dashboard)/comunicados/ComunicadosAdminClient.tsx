'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Edit2,
  Link as LinkIcon,
  Loader2,
  List,
  ListOrdered,
  Plus,
  Search,
  Save,
  Trash2,
  Underline,
  X,
  Italic,
} from 'lucide-react'
import type { ComunicadoAdminItem, ComunicadoProfile } from '@/lib/comunicados'

type ComunicadosAdminClientProps = {
  profiles: ComunicadoProfile[]
  initialItems: ComunicadoAdminItem[]
}

type FormState = {
  titulo: string
  texto_html: string
  target_profile_ids: string[]
  fixo_topo: boolean
  data_inicio_veiculacao: string
  data_fim_veiculacao: string
  status: 'ativo' | 'inativo'
}

const INITIAL_FORM: FormState = {
  titulo: '',
  texto_html: '',
  target_profile_ids: [],
  fixo_topo: false,
  data_inicio_veiculacao: '',
  data_fim_veiculacao: '',
  status: 'ativo',
}

function toLocalInputValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function joinNames(names: string[], limit = 3) {
  if (names.length === 0) return 'Nenhum'
  if (names.length <= limit) return names.join(', ')
  return `${names.slice(0, limit).join(', ')} e mais ${names.length - limit}`
}

function statusBadge(status: string) {
  if (status === 'ativo') return 'bg-emerald-100 text-emerald-700'
  if (status === 'inativo') return 'bg-slate-100 text-slate-600'
  if (status === 'agendado') return 'bg-sky-100 text-sky-700'
  return 'bg-amber-100 text-amber-700'
}

function statusLabel(status: string) {
  if (status === 'ativo') return 'Ativo'
  if (status === 'inativo') return 'Inativo'
  if (status === 'agendado') return 'Agendado'
  return 'Expirado'
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const [fontFamily, setFontFamily] = useState('Tahoma')
  const [foreColor, setForeColor] = useState('#111827')
  const [backColor, setBackColor] = useState('#fff7cc')
  const [plainLength, setPlainLength] = useState(0)
  const editorId = 'comunicado-editor'

  useEffect(() => {
    const editor = document.getElementById(editorId)
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value || ''
      setPlainLength(editor.textContent?.trim().length || 0)
    }
  }, [value])

  function syncFromDom() {
    const editor = document.getElementById(editorId)
    if (!editor) return
    const nextHtml = editor.innerHTML
    const nextLength = editor.textContent?.trim().length || 0
    setPlainLength(nextLength)
    onChange(nextHtml)
  }

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg)
    syncFromDom()
  }

  function handleLink() {
    const url = window.prompt('Informe o link (https://...)')
    if (!url) return
    exec('createLink', url)
  }

  return (
    <div className="comunicado-editor">
      <div className="comunicado-editor-toolbar">
        <select
          className="comunicado-editor-select"
          value={fontFamily}
          onChange={(e) => {
            const next = e.target.value
            setFontFamily(next)
            exec('fontName', next)
          }}
        >
          <option value="Tahoma">Tahoma</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
        </select>
        <label className="comunicado-editor-swatch">
          <span>Fonte</span>
          <input
            type="color"
            value={foreColor}
            onChange={(e) => {
              setForeColor(e.target.value)
              exec('foreColor', e.target.value)
            }}
          />
        </label>
        <label className="comunicado-editor-swatch">
          <span>Fundo</span>
          <input
            type="color"
            value={backColor}
            onChange={(e) => {
              setBackColor(e.target.value)
              exec('hiliteColor', e.target.value)
            }}
          />
        </label>
        <button type="button" className="comunicado-editor-btn" onClick={() => exec('bold')} title="Negrito">
          <Bold size={15} />
        </button>
        <button type="button" className="comunicado-editor-btn" onClick={() => exec('italic')} title="Itálico">
          <Italic size={15} />
        </button>
        <button type="button" className="comunicado-editor-btn" onClick={() => exec('underline')} title="Sublinhado">
          <Underline size={15} />
        </button>
        <button type="button" className="comunicado-editor-btn" onClick={() => exec('insertOrderedList')} title="Lista numerada">
          <ListOrdered size={15} />
        </button>
        <button type="button" className="comunicado-editor-btn" onClick={() => exec('insertUnorderedList')} title="Lista com marcadores">
          <List size={15} />
        </button>
        <button type="button" className="comunicado-editor-btn" onClick={() => exec('justifyLeft')} title="Alinhar à esquerda">
          <AlignLeft size={15} />
        </button>
        <button type="button" className="comunicado-editor-btn" onClick={() => exec('justifyCenter')} title="Centralizar">
          <AlignCenter size={15} />
        </button>
        <button type="button" className="comunicado-editor-btn" onClick={() => exec('justifyRight')} title="Alinhar à direita">
          <AlignRight size={15} />
        </button>
        <button type="button" className="comunicado-editor-btn" onClick={handleLink} title="Link">
          <LinkIcon size={15} />
        </button>
      </div>
      <div
        id={editorId}
        className="comunicado-editor-area"
        contentEditable
        suppressContentEditableWarning
        onInput={syncFromDom}
        onBlur={syncFromDom}
        onPaste={() => window.setTimeout(syncFromDom, 0)}
      />
      <div className="comunicado-editor-counter">
        <span>{plainLength}/2000 caracteres</span>
      </div>
    </div>
  )
}

export default function ComunicadosAdminClient({ profiles, initialItems }: ComunicadosAdminClientProps) {
  const [items, setItems] = useState<ComunicadoAdminItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo' | 'agendado' | 'expirado'>('todos')
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)

  const allProfileIds = useMemo(() => profiles.map((profile) => profile.id), [profiles])

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    setForm((current) => {
      if (current.target_profile_ids.length > 0 || allProfileIds.length === 0) return current
      return { ...current, target_profile_ids: allProfileIds }
    })
  }, [allProfileIds])

  async function refresh() {
    setLoading(true)
    try {
      const response = await fetch('/api/comunicados')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao carregar comunicados.')
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar comunicados.')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditingId(null)
    setError(null)
    const now = new Date()
    const later = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    setForm({
      ...INITIAL_FORM,
      target_profile_ids: allProfileIds,
      data_inicio_veiculacao: toLocalInputValue(now.toISOString()),
      data_fim_veiculacao: toLocalInputValue(later.toISOString()),
    })
    setIsModalOpen(true)
  }

  function openEdit(item: ComunicadoAdminItem) {
    setEditingId(item.id)
    setError(null)
    setForm({
      titulo: item.titulo,
      texto_html: item.texto_html,
      target_profile_ids: item.target_profiles.map((profile) => profile.id),
      fixo_topo: item.fixo_topo,
      data_inicio_veiculacao: toLocalInputValue(item.data_inicio_veiculacao),
      data_fim_veiculacao: toLocalInputValue(item.data_fim_veiculacao),
      status: item.status,
    })
    setIsModalOpen(true)
  }

  async function saveItem() {
    setSaving(true)
    setError(null)

    try {
      const payload = {
        titulo: form.titulo,
        texto_html: form.texto_html,
        target_profile_ids: form.target_profile_ids,
        fixo_topo: form.fixo_topo,
        data_inicio_veiculacao: form.data_inicio_veiculacao,
        data_fim_veiculacao: form.data_fim_veiculacao,
        status: form.status,
      }

      const response = await fetch(editingId ? `/api/comunicados/${editingId}` : '/api/comunicados', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao salvar comunicado.')

      setItems(Array.isArray(data.items) ? data.items : [])
      setIsModalOpen(false)
      window.dispatchEvent(new Event('comunicados:refresh'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar comunicado.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(item: ComunicadoAdminItem) {
    const next = item.status === 'ativo' ? 'inativo' : 'ativo'
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/comunicados/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao alterar status.')
      setItems(Array.isArray(data.items) ? data.items : [])
      window.dispatchEvent(new Event('comunicados:refresh'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao alterar status.')
    } finally {
      setSaving(false)
    }
  }

  async function removeItem(item: ComunicadoAdminItem) {
    if (!window.confirm(`Excluir o comunicado "${item.titulo}"?`)) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/comunicados/${item.id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Falha ao excluir comunicado.')
      setItems(Array.isArray(data.items) ? data.items : [])
      window.dispatchEvent(new Event('comunicados:refresh'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir comunicado.')
    } finally {
      setSaving(false)
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        item.target_profiles.some((profile) => profile.name.toLowerCase().includes(search.toLowerCase()))
      const matchesStatus = statusFilter === 'todos' || item.status_view === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [items, search, statusFilter])

  return (
    <div className="hub-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brs-navy)', margin: 0 }}>Comunicados</h1>
          <p style={{ color: 'var(--brs-gray-400)', marginTop: '0.25rem' }}>
            Gere comunicados do editor e publique no quadro do Workspace
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} />
          Novo Comunicado
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div className="search-input" style={{ maxWidth: '420px', flex: 1 }}>
            <Search />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título ou perfil alvo..."
            />
          </div>
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} style={{ maxWidth: 220 }}>
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
            <option value="agendado">Agendados</option>
            <option value="expirado">Expirados</option>
          </select>
        </div>

        {error && (
          <div style={{ padding: '0 1rem 1rem', color: 'var(--brs-danger)', fontSize: '0.875rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Criação</th>
                <th>Veiculação inicial</th>
                <th>Veiculação final</th>
                <th>Status</th>
                <th>Visualizações</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="spinner" size={24} />
                    <p style={{ marginTop: '0.5rem', color: 'var(--brs-gray-400)' }}>Carregando comunicados...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--brs-gray-400)' }}>
                    Nenhum comunicado encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'grid', gap: '0.35rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--brs-navy)' }}>{item.titulo}</div>
                        {item.fixo_topo ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brs-gold)' }}>Fixo no topo</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{new Date(item.created_at).toLocaleString('pt-BR')}</td>
                    <td>{new Date(item.data_inicio_veiculacao).toLocaleString('pt-BR')}</td>
                    <td>{new Date(item.data_fim_veiculacao).toLocaleString('pt-BR')}</td>
                    <td>
                      <span className={`badge ${statusBadge(item.status_view)}`}>{statusLabel(item.status_view)}</span>
                    </td>
                    <td>
                      <div style={{ display: 'grid', gap: '0.25rem', minWidth: 260 }}>
                        <div style={{ fontWeight: 700, color: 'var(--brs-gray-700)' }}>
                          {item.viewed_count}/{item.target_count} visualizados
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-500)' }}>
                          <strong>Vistos:</strong> {joinNames(item.viewed_users.map((user) => user.name))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-500)' }}>
                          <strong>Pendentes:</strong> {joinNames(item.pending_users.map((user) => user.name))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline" onClick={() => openEdit(item)}>
                          <Edit2 size={14} />
                          Editar
                        </button>
                        <button className="btn btn-outline" onClick={() => toggleStatus(item)} disabled={saving}>
                          {item.status === 'ativo' ? 'Inativar' : 'Ativar'}
                        </button>
                        <button className="btn btn-outline" onClick={() => removeItem(item)} disabled={saving} style={{ color: 'var(--brs-danger)' }}>
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-shell" style={{ width: 'min(1100px, 96vw)', maxHeight: '94vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Editar Comunicado' : 'Novo Comunicado'}</h2>
              <button className="icon-button" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '0 1.25rem 1rem', color: 'var(--brs-danger)', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ padding: '0 1.25rem 1.25rem', display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Título *</span>
                <input
                  className="form-control"
                  value={form.titulo}
                  maxLength={60}
                  onChange={(e) => setForm((current) => ({ ...current, titulo: e.target.value.slice(0, 60) }))}
                  placeholder="Digite o título do comunicado"
                />
              </label>

              <label style={{ display: 'grid', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Público-alvo *</span>
                <div className="comunicado-targets">
                  {profiles.map((profile) => {
                    const checked = form.target_profile_ids.includes(profile.id)
                    return (
                      <label key={profile.id} className="comunicado-target-option">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setForm((current) => {
                              const next = new Set(current.target_profile_ids)
                              if (e.target.checked) next.add(profile.id)
                              else next.delete(profile.id)
                              return { ...current, target_profile_ids: Array.from(next) }
                            })
                          }}
                        />
                        <span>{profile.name}</span>
                      </label>
                    )
                  })}
                </div>
              </label>

              <div style={{ display: 'grid', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700 }}>Texto do Comunicado *</span>
                <RichTextEditor
                  value={form.texto_html}
                  onChange={(next) => setForm((current) => ({ ...current, texto_html: next }))}
                />
              </div>

              <label className="comunicado-pin-toggle">
                <input
                  type="checkbox"
                  checked={form.fixo_topo}
                  onChange={(e) => setForm((current) => ({ ...current, fixo_topo: e.target.checked }))}
                />
                <span>Ficar fixo no topo</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 700 }}>Data/hora inicial *</span>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.data_inicio_veiculacao}
                    onChange={(e) => setForm((current) => ({ ...current, data_inicio_veiculacao: e.target.value }))}
                  />
                </label>
                <label style={{ display: 'grid', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 700 }}>Data/hora final *</span>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={form.data_fim_veiculacao}
                    onChange={(e) => setForm((current) => ({ ...current, data_fim_veiculacao: e.target.value }))}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={() => void saveItem()} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
