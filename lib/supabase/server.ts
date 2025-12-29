import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !service) {
  console.warn('Supabase server client não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
}

function makeNoopClient() {
  const ch: any = {
    from: () => ch,
    select: () => ch,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
    rpc: async () => ({ data: null, error: null }),
    order: () => ch,
    eq: () => ch,
    in: () => ch,
    limit: () => ch,
    gte: () => ch,
    lte: () => ch,
    then: (resolve: any, reject: any) => Promise.resolve({ data: null, error: null }).then(resolve, reject),
    auth: { admin: {} }
  }
  return ch
}

export function createClient() {
  if (!url || !service) {
    console.warn('Supabase server client not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
    return makeNoopClient()
  }

  return createSupabaseClient(url, service, {
    auth: {
      persistSession: false
    }
  })
}

// Convenience singleton for server-side operations (service role key)
// If env vars are missing, export a safe stub that returns empty results without
// throwing so Next.js build-time page data collection can continue.
let _supabaseAdmin: any
if (url && service) {
  _supabaseAdmin = createClient()
} else {
  _supabaseAdmin = makeNoopClient()
}

export const supabaseAdmin = _supabaseAdmin
