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
    auth: { admin: {} },
    __isNoop: true
  }
  return ch
}

export function createClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase server client not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
    return makeNoopClient()
  }

  return createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false
    }
  })
}

// Convenience singleton for server-side operations (service role key)
// Export a proxy that ensures the real client is created lazily when env vars
// become available at runtime (helps dev without requiring a server restart).
let _supabaseAdmin: any = makeNoopClient()

function isNoopClient(c: any) {
  return !!c && !!c.__isNoop
}

const supabaseAdminProxy = new Proxy({}, {
  get(_target, prop) {
    // If we currently have a noop client but env vars are now present, create real client
    if (isNoopClient(_supabaseAdmin) && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      _supabaseAdmin = createClient()
    }

    const val = (_supabaseAdmin as any)[prop]
    // If it's a function, bind to the underlying client
    if (typeof val === 'function') return val.bind(_supabaseAdmin)
    return val
  }
})

export const supabaseAdmin = supabaseAdminProxy as any

