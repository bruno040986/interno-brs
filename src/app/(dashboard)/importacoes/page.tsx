'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react'

interface ImportResult {
  success: boolean
  total: number
  created: number
  updated: number
  errors: number
  errorDetails: { row: number; cpf: string; error: string }[]
}

export default function ImportacoesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.xls') || f.name.endsWith('.xlsx') || f.name.endsWith('.csv'))) {
      setFile(f)
      setResult(null)
      setError('')
    } else {
      setError('Apenas arquivos .xls, .xlsx ou .csv são aceitos.')
    }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro na importação'); return }
      setResult(data)
    } catch {
      setError('Erro ao conectar com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setResult(null); setError('') }
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--brs-gray-800)', margin: 0 }}>
          Importação de Colaboradores
        </h1>
        <p style={{ color: 'var(--brs-gray-400)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          Importe o relatório exportado pelo QuarkRH (.xls, .xlsx ou .csv)
        </p>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div className="card">
          <div className="card-body">
            {/* Drop zone */}
            <div
              id="drop-zone"
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--brs-navy)' : 'var(--brs-gray-200)'}`,
                borderRadius: 12,
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'rgba(27,58,107,0.04)' : 'var(--brs-gray-50)',
                transition: 'all 0.2s',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                id="file-input"
              />
              <Upload size={36} style={{ color: 'var(--brs-gray-400)', margin: '0 auto 0.75rem', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--brs-gray-600)' }}>
                Arraste o arquivo ou clique para selecionar
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--brs-gray-400)' }}>
                Suporte: .xls, .xlsx, .csv — Relatório Completo de Colaboradores do QuarkRH
              </p>
            </div>

            {/* Arquivo selecionado */}
            {file && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1rem', background: 'rgba(27,58,107,0.05)',
                borderRadius: 8, marginTop: '1rem'
              }}>
                <FileSpreadsheet size={20} style={{ color: 'var(--brs-navy)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--brs-gray-800)' }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--brs-gray-400)' }} />
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                id="btn-importar"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={!file || loading}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {loading ? <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Upload size={16} />}
                {loading ? 'Importando...' : 'Importar Colaboradores'}
              </button>
              {file && (
                <button className="btn btn-outline" onClick={() => { setFile(null); setResult(null); setError('') }}>
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resultado */}
        {result && (
          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 className="card-title">
                <CheckCircle size={16} style={{ color: 'var(--brs-success)', marginRight: 6, verticalAlign: 'middle' }} />
                Resultado da Importação
              </h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Total de linhas', value: result.total, color: 'var(--brs-navy)' },
                  { label: 'Criados', value: result.created, color: 'var(--brs-success)' },
                  { label: 'Atualizados', value: result.updated, color: 'var(--brs-info)' },
                  { label: 'Erros', value: result.errors, color: result.errors > 0 ? 'var(--brs-danger)' : 'var(--brs-gray-400)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--brs-gray-50)', borderRadius: 8 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--brs-gray-400)', marginTop: '0.25rem' }}>{label}</div>
                  </div>
                ))}
              </div>

              {result.errorDetails.length > 0 && (
                <>
                  <div className="section-divider">Erros encontrados</div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {result.errorDetails.map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                        <AlertCircle size={14} style={{ color: 'var(--brs-danger)', flexShrink: 0, marginTop: 1 }} />
                        <span><strong>Linha {e.row}</strong>{e.cpf ? ` — CPF ${e.cpf}` : ''}: {e.error}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <div className="card-header">
            <h2 className="card-title">Como exportar do QuarkRH</h2>
          </div>
          <div className="card-body">
            <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--brs-gray-600)', lineHeight: 1.8 }}>
              <li>Acesse o QuarkRH e vá em <strong>Relatórios → Colaboradores</strong></li>
              <li>Selecione <strong>&quot;Relatório Completo de Colaboradores&quot;</strong></li>
              <li>Exporte no formato <strong>.xls ou .xlsx</strong></li>
              <li>Faça o upload do arquivo acima</li>
              <li>O sistema identificará automaticamente as colunas e importará os dados</li>
            </ol>
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              O CPF é usado como identificador único. Colaboradores já existentes terão seus dados atualizados automaticamente.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
