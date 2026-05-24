import { NextResponse } from 'next/server'

type BrasilApiBank = {
  ispb?: string
  name?: string
  code?: number | string
  fullName?: string
}

export async function GET() {
  try {
    const res = await fetch('https://brasilapi.com.br/api/banks/v1', {
      // Cache server-side to avoid repeated calls
      next: { revalidate: 60 * 60 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Falha ao buscar bancos' }, { status: 502 })
    }

    const data = (await res.json()) as BrasilApiBank[]
    const banks = (Array.isArray(data) ? data : [])
      .filter((b) => b && b.name)
      .map((b) => ({
        code: b.code ?? '',
        name: b.name ?? '',
        fullName: b.fullName ?? '',
        ispb: b.ispb ?? '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ banks })
  } catch {
    return NextResponse.json({ error: 'Falha ao buscar bancos' }, { status: 502 })
  }
}

