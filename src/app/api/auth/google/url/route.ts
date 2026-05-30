import { NextResponse } from 'next/server'
import { generateGoogleAuthUrl } from '@/lib/google/oauth'

export async function GET(request: Request) {
  const state = request.headers.get('x-oauth-state') || Math.random().toString(36).substring(7)
  const authUrl = generateGoogleAuthUrl(state)
  return NextResponse.json({ authUrl, state })
}
