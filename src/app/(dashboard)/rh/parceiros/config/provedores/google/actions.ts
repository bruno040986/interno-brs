'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGoogleConfig() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_google_config')
    .select('*')
    .single()

  if (error) return null
  return data
}

export async function updateGoogleConfig(formData: FormData) {
  const supabase = await createClient()
  
  const client_id = formData.get('client_id') as string
  const client_secret = formData.get('client_secret') as string

  const { error } = await supabase
    .from('system_google_config')
    .update({
      client_id,
      client_secret,
      updated_at: new Date().toISOString()
    })
    .match({ id: formData.get('id') })

  if (error) throw new Error(error.message)

  revalidatePath('/rh/parceiros/config/provedores/google')
  return { success: true }
}
