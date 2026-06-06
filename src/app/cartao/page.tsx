import type { Metadata } from 'next'
import { getPublicCommercialCardBySlug } from '@/lib/commercial-card-public'
import PublicCommercialCard from './_components/PublicCommercialCard'

export const dynamic = 'force-dynamic'

type CartaoSearchParams = Promise<{
  slug?: string | string[]
  view?: string | string[]
  mode?: string | string[]
}>

type CartaoSearchParamsResolved = {
  slug?: string | string[]
  view?: string | string[]
  mode?: string | string[]
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return !!value && typeof (value as Promise<unknown>).then === 'function'
}

async function resolveSearchParams(
  searchParams?: CartaoSearchParams | CartaoSearchParamsResolved,
): Promise<CartaoSearchParamsResolved | undefined> {
  if (!searchParams) return undefined
  if (isPromise<CartaoSearchParamsResolved>(searchParams)) return await searchParams
  return searchParams
}

async function resolveSlug(searchParams?: CartaoSearchParams | CartaoSearchParamsResolved) {
  const resolved = await resolveSearchParams(searchParams)
  const raw = resolved?.slug
  if (Array.isArray(raw)) return String(raw[0] || '').trim().toLowerCase()
  return String(raw || '').trim().toLowerCase()
}

export default async function CartaoPublicPage({
  searchParams,
}: {
  searchParams?: CartaoSearchParams | CartaoSearchParamsResolved
}) {
  const resolvedSearchParams = await resolveSearchParams(searchParams)
  const slug = await resolveSlug(resolvedSearchParams)
  const viewRaw = resolvedSearchParams?.view ?? resolvedSearchParams?.mode
  const view = Array.isArray(viewRaw) ? String(viewRaw[0] || '').trim().toLowerCase() : String(viewRaw || '').trim().toLowerCase()
  const cardMode = view === 'links' ? 'links' : 'card'
  if (!slug) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(180deg, #f7f9ff 0%, #eef3ff 50%, #f9fbff 100%)',
          color: '#123a77',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 560,
            padding: '2rem',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(45, 92, 255, 0.12)',
            boxShadow: '0 22px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>Cartão não encontrado</h1>
          <p style={{ margin: '0.75rem 0 0', color: '#52617a', lineHeight: 1.6 }}>
            Informe o slug do cartão na URL, por exemplo <strong>/cartao?slug=ketellen</strong>, ou acesse pelo subdomínio publicado.
          </p>
        </div>
      </main>
    )
  }

  const data = await getPublicCommercialCardBySlug(slug)
  if (!data) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(180deg, #f7f9ff 0%, #eef3ff 50%, #f9fbff 100%)',
          color: '#123a77',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 560,
            padding: '2rem',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(45, 92, 255, 0.12)',
            boxShadow: '0 22px 60px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>Cartão não encontrado</h1>
          <p style={{ margin: '0.75rem 0 0', color: '#52617a', lineHeight: 1.6 }}>
            Não encontramos um cartão público ativo para <strong>{slug}</strong>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <PublicCommercialCard
      slug={slug}
      entity={data.entity}
      companyProfile={data.companyProfile}
      linkedUser={data.linkedUser}
      cardLinks={data.cardLinks}
      parent={data.parent}
      superior={data.superior}
      mode={cardMode}
    />
  )
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: CartaoSearchParams | CartaoSearchParamsResolved
}): Promise<Metadata> {
  const slug = await resolveSlug(searchParams)

  if (!slug) {
    return {
      title: 'Cartão Virtual - BRS Promotora',
      description: 'Cartão virtual público da BRS Promotora.',
    }
  }

  try {
    const data = await getPublicCommercialCardBySlug(slug)
    if (!data) {
      return {
        title: 'Cartão não encontrado - BRS Promotora',
        description: 'Cartão virtual público não encontrado.',
      }
    }

    const name = String(data.entity.cadastral_data?.commercial_name || data.entity.cadastral_data?.full_name || data.entity.name || 'Cartão Virtual').trim()
    return {
      title: `${name} - BRS Promotora`,
      description: 'Cartão virtual público da BRS Promotora.',
    }
  } catch {
    return {
      title: 'Cartão Virtual - BRS Promotora',
      description: 'Cartão virtual público da BRS Promotora.',
    }
  }
}
