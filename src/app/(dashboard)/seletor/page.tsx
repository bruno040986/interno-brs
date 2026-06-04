import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function SeletorPage() {
  redirect('/rh/parceiros/config/comercial/seletor')
}
