import { NextResponse } from 'next/server'
import { generateGoogleAuthUrl, isGoogleConfigured } from '@/lib/google/oauth'

export async function GET(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Missing credentials.' },
        { status: 400 }
      )
    }

    const state = request.headers.get('x-oauth-state') || Math.random().toString(36).substring(7)
    const authUrl = generateGoogleAuthUrl(state)
    return NextResponse.json({ authUrl, state })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}
