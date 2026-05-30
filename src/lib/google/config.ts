// Configuração do Google OAuth a partir das variáveis de ambiente

export const googleConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
}

export const googleScopes = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.spaces',
]

export function isGoogleConfigured(): boolean {
  return !!(googleConfig.clientId && googleConfig.clientSecret)
}
