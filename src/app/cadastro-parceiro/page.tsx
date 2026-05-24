import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CadastroParceiroPage() {
  notFound()
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Página não encontrada',
  }
}
