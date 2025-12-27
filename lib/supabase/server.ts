import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? ''
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!url || !service) {
  console.warn('Supabase server client não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
}

export function createClient() {
  return createSupabaseClient(url, service, {
    auth: {
      persistSession: false
    }
  })
}

// Convenience singleton for server-side operations (service role key)
export const supabaseAdmin = createClient()
