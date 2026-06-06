import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BRS Workspace',
  description: 'Sistema interno de RH - BRS 2 Promotora Ltda',
  icons: {
    icon: '/favicon/FAVICON-BRS-PROMOTORA.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
