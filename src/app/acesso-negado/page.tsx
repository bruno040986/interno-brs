import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function AcessoNegadoPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background: 'var(--brs-gray-50)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 420,
          border: '1px solid var(--brs-gray-100)',
          borderRadius: 8,
          background: 'var(--brs-surface)',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <ShieldAlert size={42} style={{ color: 'var(--brs-danger)', margin: '0 auto 1rem' }} />
        <h1 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--brs-gray-800)' }}>
          Acesso negado
        </h1>
        <p style={{ color: 'var(--brs-gray-500)', lineHeight: 1.5, margin: '0.75rem 0 1.5rem' }}>
          Seu usuario nao tem permissao para acessar esta area.
        </p>
        <Link className="btn btn-primary" href="/">
          Voltar ao Workspace
        </Link>
      </section>
    </main>
  )
}
