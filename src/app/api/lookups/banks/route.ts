import { NextResponse } from 'next/server'

type BrasilApiBank = {
  ispb?: string
  name?: string
  code?: number | string
  fullName?: string
}

export async function GET(request: Request) {
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

    const q = String(new URL(request.url).searchParams.get('q') || '').trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    const filtered =
      q.length >= 3
        ? banks.filter((bank) => {
            const code = String(bank.code || '').replace(/\D/g, '').slice(0, 3).padStart(3, '0')
            if (/^\d+$/.test(q) && qDigits.length >= 3) {
              return code === qDigits.slice(0, 3)
            }
            const label = `${code} ${bank.name} ${bank.fullName} ${bank.ispb}`.toLowerCase()
            return label.includes(q)
          })
        : q.length > 0
          ? []
          : banks

    return NextResponse.json({ banks: filtered })
  } catch {
    return NextResponse.json({ error: 'Falha ao buscar bancos' }, { status: 502 })
  }
}
