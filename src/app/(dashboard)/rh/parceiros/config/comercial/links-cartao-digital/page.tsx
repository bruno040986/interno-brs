'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpDown,
  AtSign,
  BadgeCheck,
  Banknote,
  Bell,
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  Camera,
  Calendar,
  Car,
  CheckCircle2,
  CircleX,
  Clock,
  Cloud,
  Code,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Flag,
  FolderOpen,
  Gift,
  Globe,
  GripVertical,
  Heart,
  Home,
  Image,
  Info,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Menu,
  MoreHorizontal,
  NotebookPen,
  Package,
  Palette,
  Paperclip,
  Phone,
  Plus,
  Printer,
  QrCode,
  Rocket,
  Scan,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Target,
  Ticket,
  Timer,
  Trash2,
  TrendingUp,
  User,
  Users,
  Video,
  Wifi,
  Wrench,
  X,
} from 'lucide-react'
import {
  deleteCommercialCardLink,
  getCommercialCardLinks,
  reorderCommercialCardLinks,
  saveCommercialCardLink,
  type CommercialCardLinkRow,
} from '../../../actions'

type LocalLinkRow = CommercialCardLinkRow & { temp?: boolean }

type IconOption = {
  key: string
  label: string
  Icon: typeof Link2
}

const ICON_OPTIONS: IconOption[] = [
  { key: 'link', label: 'Link', Icon: Link2 },
  { key: 'globe', label: 'Site', Icon: Globe },
  { key: 'mail', label: 'E-mail', Icon: Mail },
  { key: 'phone', label: 'Telefone', Icon: Phone },
  { key: 'message', label: 'Mensagem', Icon: MessageCircle },
  { key: 'file', label: 'Arquivo', Icon: FileText },
  { key: 'book', label: 'Conteudo', Icon: BookOpen },
  { key: 'megaphone', label: 'Aviso', Icon: Megaphone },
  { key: 'users', label: 'Pessoas', Icon: Users },
  { key: 'qr', label: 'QR Code', Icon: QrCode },
  { key: 'external', label: 'Externo', Icon: ExternalLink },
  { key: 'more', label: 'Mais', Icon: MoreHorizontal },
  { key: 'home', label: 'Inicio', Icon: Home },
  { key: 'search', label: 'Buscar', Icon: Search },
  { key: 'calendar', label: 'Agenda', Icon: Calendar },
  { key: 'shield', label: 'Seguranca', Icon: BadgeCheck },
  { key: 'bank', label: 'Banco', Icon: Banknote },
  { key: 'briefcase', label: 'Negocio', Icon: Briefcase },
  { key: 'building', label: 'Empresa', Icon: Building2 },
  { key: 'camera', label: 'Camera', Icon: Camera },
  { key: 'car', label: 'Carro', Icon: Car },
  { key: 'check', label: 'Ok', Icon: CheckCircle2 },
  { key: 'clock', label: 'Hora', Icon: Clock },
  { key: 'cloud', label: 'Nuvem', Icon: Cloud },
  { key: 'code', label: 'Codigo', Icon: Code },
  { key: 'card', label: 'Cartao', Icon: CreditCard },
  { key: 'download', label: 'Download', Icon: Download },
  { key: 'folder', label: 'Pasta', Icon: FolderOpen },
  { key: 'gift', label: 'Presente', Icon: Gift },
  { key: 'heart', label: 'Favorito', Icon: Heart },
  { key: 'image', label: 'Imagem', Icon: Image },
  { key: 'info', label: 'Info', Icon: Info },
  { key: 'key', label: 'Chave', Icon: KeyRound },
  { key: 'lock', label: 'Bloqueio', Icon: BadgeCheck },
  { key: 'pin', label: 'Local', Icon: MapPin },
  { key: 'menu', label: 'Menu', Icon: Menu },
  { key: 'message-square', label: 'Chat', Icon: MessageSquare },
  { key: 'notebook', label: 'Caderno', Icon: NotebookPen },
  { key: 'package', label: 'Pacote', Icon: Package },
  { key: 'palette', label: 'Paleta', Icon: Palette },
  { key: 'paperclip', label: 'Anexo', Icon: Paperclip },
  { key: 'play', label: 'Play', Icon: Video },
  { key: 'printer', label: 'Impressora', Icon: Printer },
  { key: 'rocket', label: 'Lancamento', Icon: Rocket },
  { key: 'scan', label: 'Scanner', Icon: Scan },
  { key: 'share', label: 'Compartilhar', Icon: Share2 },
  { key: 'settings', label: 'Ajustes', Icon: Settings },
  { key: 'shop', label: 'Compras', Icon: ShoppingBag },
  { key: 'sparkles', label: 'Destaque', Icon: Sparkles },
  { key: 'star', label: 'Estrela', Icon: Star },
  { key: 'tag', label: 'Etiqueta', Icon: Tag },
  { key: 'target', label: 'Meta', Icon: Target },
  { key: 'ticket', label: 'Ticket', Icon: Ticket },
  { key: 'timer', label: 'Tempo', Icon: Timer },
  { key: 'trend', label: 'Crescimento', Icon: TrendingUp },
  { key: 'user', label: 'Usuario', Icon: User },
  { key: 'wifi', label: 'Wi-Fi', Icon: Wifi },
  { key: 'wrench', label: 'Ferramenta', Icon: Wrench },
  { key: 'threads', label: 'Threads', Icon: AtSign },
  { key: 'x', label: 'X', Icon: X },
  { key: 'bell', label: 'Alerta', Icon: Bell },
  { key: 'bookmark', label: 'Salvar', Icon: Bookmark },
  { key: 'flag', label: 'Bandeira', Icon: Flag },
]

function normalizeUrl(value: string) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function IconPreview({ iconKey, size = 18 }: { iconKey: string; size?: number }) {
  const option = ICON_OPTIONS.find((item) => item.key === iconKey) || ICON_OPTIONS[0]
  const Icon = option.Icon
  return <Icon size={size} />
}

function IconPicker({
  open,
  selectedKey,
  onClose,
  onPick,
}: {
  open: boolean
  selectedKey?: string | null
  onClose: () => void
  onPick: (key: string) => void
}) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 'min(920px, 100%)', maxHeight: '82vh', overflow: 'auto', padding: '1.1rem' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brs-navy)' }}>Selecionar ícone</div>
            <div style={{ color: 'var(--brs-gray-500)', fontSize: '0.9rem' }}>Escolha o SVG que melhor representa o link no cartão.</div>
          </div>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))',
            gap: '0.45rem',
          }}
        >
          {ICON_OPTIONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              style={{
                width: '100%',
                minHeight: 74,
                padding: '0.4rem',
                display: 'grid',
                placeItems: 'center',
                gap: 0,
                borderRadius: 16,
                border: selectedKey === key ? '1.5px solid var(--brs-navy)' : '1px solid var(--brs-gray-100)',
                background: selectedKey === key ? 'rgba(27, 58, 107, 0.08)' : '#fff',
                boxShadow: '0 1px 0 rgba(15, 23, 42, 0.02)',
                cursor: 'pointer',
              }}
              onClick={() => onPick(key)}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--brs-navy)',
                  background: 'var(--brs-gray-50)',
                  border: '1px solid var(--brs-gray-100)',
                }}
              >
                <Icon size={18} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LinksCartaoDigitalPage() {
  const [links, setLinks] = useState<LocalLinkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [iconPickerForId, setIconPickerForId] = useState<string | null>(null)
  const initializedRef = useRef(false)

  async function loadLinks() {
    setLoading(true)
    const res = await getCommercialCardLinks()
    if (res.success) {
      setLinks(((res.links || []) as CommercialCardLinkRow[]).map((link) => ({ ...link })))
      setMessage(null)
    } else {
      setMessage({ type: 'error', text: res.error || 'Não foi possível carregar os links.' })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    void loadLinks()
  }, [])

  async function persistLink(row: LocalLinkRow) {
    const name = String(row.name || '').trim()
    const destination_url = normalizeUrl(String(row.destination_url || ''))
    if (!name && !destination_url && row.temp) return
    if (!name || !destination_url) return

    setSavingId(row.id)
    setMessage(null)
    const res = await saveCommercialCardLink({
      id: row.temp ? undefined : row.id,
      name,
      destination_url,
      icon_key: String(row.icon_key || 'link'),
      position: Number(row.position || 0),
      is_active: row.is_active,
    })
    if (res.success) {
      setMessage({ type: 'success', text: 'Link salvo com sucesso.' })
      await loadLinks()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao salvar link.' })
    }
    setSavingId(null)
  }

  async function handleDelete(row: LocalLinkRow) {
    if (row.temp) {
      setLinks((current) => current.filter((item) => item.id !== row.id))
      return
    }
    if (!confirm('Excluir este link do cartão digital?')) return
    setSavingId(row.id)
    const res = await deleteCommercialCardLink(row.id)
    if (res.success) {
      setMessage({ type: 'success', text: 'Link excluído.' })
      await loadLinks()
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao excluir link.' })
    }
    setSavingId(null)
  }

  async function handleToggleActive(row: LocalLinkRow, nextValue: boolean) {
    const nextRow = { ...row, is_active: nextValue }
    setLinks((current) => current.map((item) => (item.id === row.id ? nextRow : item)))
    if (row.temp) return
    await persistLink(nextRow)
  }

  function handleChange(rowId: string, patch: Partial<LocalLinkRow>) {
    setLinks((current) => current.map((item) => (item.id === rowId ? { ...item, ...patch } : item)))
  }

  async function handleBlur(row: LocalLinkRow) {
    await persistLink(row)
  }

  function createRow() {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const nextPosition = links.length
    setLinks((current) => [
      ...current,
      {
        id: tempId,
        name: '',
        destination_url: '',
        icon_key: 'link',
        position: nextPosition,
        is_active: true,
        temp: true,
      },
    ])
  }

  function moveRow(fromId: string, toId: string) {
    if (fromId === toId) return
    setLinks((current) => {
      const next = [...current]
      const fromIndex = next.findIndex((item) => item.id === fromId)
      const toIndex = next.findIndex((item) => item.id === toId)
      if (fromIndex < 0 || toIndex < 0) return current
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next.map((item, index) => ({ ...item, position: index }))
    })
  }

  async function commitOrder(nextLinks: LocalLinkRow[]) {
    const persisted = nextLinks.filter((item) => !item.temp)
    if (persisted.length !== nextLinks.length) return
    const res = await reorderCommercialCardLinks(persisted.map((item) => item.id))
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || 'Erro ao reordenar links.' })
      await loadLinks()
    }
  }

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return
    let normalized: LocalLinkRow[] | null = null
    setLinks((current) => {
      const next = [...current]
      const fromIndex = next.findIndex((item) => item.id === draggingId)
      const toIndex = next.findIndex((item) => item.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return current
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      normalized = next.map((item, index) => ({ ...item, position: index }))
      return normalized
    })
    if (normalized) void commitOrder(normalized)
  }

  const orderedLinks = useMemo(() => [...links].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)), [links])

  return (
    <div className="page-content" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="card" style={{ padding: '1.5rem', borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--brs-navy)' }}>Links do Cartão Digital</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--brs-gray-600)' }}>
              Edite direto na tabela, reordene arrastando e defina o ícone de cada atalho.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={createRow}>
            <Plus size={16} />
            Incluir outro link
          </button>
        </div>

        {message ? (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.8rem 1rem',
              borderRadius: 12,
              border: `1px solid ${message.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: message.type === 'success' ? '#065F46' : '#991B1B',
            }}
          >
            {message.text}
          </div>
        ) : null}

        <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--brs-gray-200)' }}>
                <th style={{ width: 40, padding: '0.85rem 0.4rem', textAlign: 'left', color: 'var(--brs-gray-500)' }}>
                  <ArrowUpDown size={16} />
                </th>
                <th style={{ minWidth: 260, padding: '0.85rem 0.4rem', textAlign: 'left', color: 'var(--brs-gray-500)' }}>Nome do Link no Cartão</th>
                <th style={{ minWidth: 360, padding: '0.85rem 0.4rem', textAlign: 'left', color: 'var(--brs-gray-500)' }}>Link de Destino</th>
                <th style={{ minWidth: 180, padding: '0.85rem 0.4rem', textAlign: 'left', color: 'var(--brs-gray-500)' }}>Ícone</th>
                <th style={{ width: 110, padding: '0.85rem 0.4rem', textAlign: 'center', color: 'var(--brs-gray-500)' }}>Ativo</th>
                <th style={{ width: 140, padding: '0.85rem 0.4rem', textAlign: 'center', color: 'var(--brs-gray-500)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '1.25rem 0.5rem', color: 'var(--brs-gray-500)' }}>
                    <Loader2 className="spinner" size={18} style={{ marginRight: 8 }} />
                    Carregando links...
                  </td>
                </tr>
              ) : orderedLinks.length ? (
                orderedLinks.map((row) => (
                  <tr
                    key={row.id}
                    draggable
                    onDragStart={() => setDraggingId(row.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => void handleDrop(row.id)}
                    style={{
                      borderBottom: '1px solid var(--brs-gray-100)',
                      background: draggingId === row.id ? 'rgba(27, 58, 107, 0.04)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.75rem 0.4rem', color: 'var(--brs-gray-400)', cursor: 'grab' }}>
                      <GripVertical size={18} />
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem' }}>
                      <input
                        className="form-control"
                        value={row.name}
                        onChange={(e) => handleChange(row.id, { name: e.target.value })}
                        onBlur={() => void handleBlur(row)}
                        placeholder="Ex: Sistema ARW"
                      />
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem' }}>
                      <input
                        className="form-control"
                        value={row.destination_url}
                        onChange={(e) => handleChange(row.id, { destination_url: e.target.value })}
                        onBlur={() => void handleBlur(row)}
                        placeholder="https://..."
                      />
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ width: '100%', justifyContent: 'flex-start', gap: '0.55rem' }}
                        onClick={() => setIconPickerForId(row.id)}
                      >
                        <IconPreview iconKey={row.icon_key} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{ICON_OPTIONS.find((item) => item.key === row.icon_key)?.label || 'Link'}</span>
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem', textAlign: 'center' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: 'var(--brs-gray-600)' }}>
                        <input
                          type="checkbox"
                          checked={!!row.is_active}
                          onChange={(e) => void handleToggleActive(row, e.target.checked)}
                        />
                        {row.is_active ? (
                          <span style={{ color: '#065F46', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={14} /> Ativo
                          </span>
                        ) : (
                          <span style={{ color: '#991B1B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CircleX size={14} /> Inativo
                          </span>
                        )}
                      </label>
                    </td>
                    <td style={{ padding: '0.75rem 0.4rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon text-danger"
                          onClick={() => void handleDelete(row)}
                          disabled={savingId === row.id}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {savingId === row.id ? (
                        <div style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--brs-gray-500)' }}>
                          <Loader2 className="spinner" size={12} style={{ marginRight: 4 }} />
                          Salvando...
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '1.25rem 0.5rem', color: 'var(--brs-gray-500)' }}>
                    Nenhum link cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IconPicker
        open={!!iconPickerForId}
        selectedKey={iconPickerForId ? links.find((item) => item.id === iconPickerForId)?.icon_key : null}
        onClose={() => setIconPickerForId(null)}
        onPick={(key) => {
          if (!iconPickerForId) return
          const target = links.find((item) => item.id === iconPickerForId)
          if (!target) return
          const nextRow = { ...target, icon_key: key }
          handleChange(iconPickerForId, { icon_key: key })
          setIconPickerForId(null)
          if (!target.temp) {
            void persistLink(nextRow)
          }
        }}
      />
    </div>
  )
}
