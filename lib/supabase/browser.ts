import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!url || !anon) {
  // It's fine to run locally without envs; uploading will fail until configured
  console.warn('Client Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
}

export const supabase = (url && anon) ? createClient(url, anon, {
  auth: {
    persistSession: true
  }
}) : {
  // noop client when envs not set — prevents build-time crashes and allows UI to render
  storage: {
    from: () => ({
      list: async () => ({ data: [], error: null }),
      upload: async () => ({ data: null, error: new Error('Supabase not configured') })
    })
  },
  auth: {
    signInWithOtp: async () => ({ error: new Error('Supabase not configured') })
  }
} as any
