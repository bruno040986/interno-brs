import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 15 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File missing' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo acima de 15MB' }, { status: 400 })
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from('workspace-chat')
      .upload(path, bytes, { contentType: file.type || 'application/octet-stream', upsert: false })

    if (uploadError) throw uploadError

    const { data: publicData } = admin.storage.from('workspace-chat').getPublicUrl(path)

    return NextResponse.json({
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicData.publicUrl,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Falha no upload. Verifique bucket workspace-chat.' }, { status: 500 })
  }
}
