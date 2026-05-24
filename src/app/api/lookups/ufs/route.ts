import { NextResponse } from 'next/server'

type BrasilApiUf = {
  sigla?: string
  nome?: string
}

export async function GET() {
  try {
    const res = await fetch('https://brasilapi.com.br/api/ibge/uf/v1', {
      next: { revalidate: 60 * 60 * 24 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Falha ao buscar UFs' }, { status: 502 })
    }

    const data = (await res.json()) as BrasilApiUf[]
    const ufs = (Array.isArray(data) ? data : [])
      .filter((u) => u && u.sigla)
      .map((u) => ({
        sigla: String(u.sigla || '').toUpperCase(),
        nome: u.nome ?? '',
      }))
      .sort((a, b) => a.sigla.localeCompare(b.sigla))

    return NextResponse.json({ ufs })
  } catch {
    return NextResponse.json({ error: 'Falha ao buscar UFs' }, { status: 502 })
  }
}

