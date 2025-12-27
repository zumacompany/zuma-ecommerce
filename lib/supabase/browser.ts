import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!url || !anon) {
  // It's fine to run locally without envs; uploading will fail until configured
  console.warn('Client Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true
  }
})
