import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? ''
const isConfigured = Boolean(url && publishableKey)

function createNoopBrowserClient() {
  const error = new Error(
    'Client Supabase not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)'
  )

  const query: any = {
    select: () => query,
    insert: async () => ({ data: null, error }),
    update: () => query,
    upsert: async () => ({ data: null, error }),
    delete: () => query,
    eq: () => query,
    neq: () => query,
    in: () => query,
    order: () => query,
    limit: () => query,
    range: () => query,
    maybeSingle: async () => ({ data: null, error }),
    single: async () => ({ data: null, error }),
    then: (resolve: any, reject: any) =>
      Promise.resolve({ data: null, error }).then(resolve, reject),
  }

  const auth = {
    getSession: async () => ({ data: { session: null }, error }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error }),
    signUp: async () => ({ data: { session: null, user: null }, error }),
    signOut: async () => ({ error }),
    getUser: async () => ({ data: { user: null }, error }),
    signInWithOtp: async () => ({ data: null, error }),
    resetPasswordForEmail: async () => ({ data: null, error }),
    updateUser: async () => ({ data: { user: null }, error }),
  }

  const storage = {
    from: () => ({
      list: async () => ({ data: [], error }),
      upload: async () => ({ data: null, error }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  }

  return {
    auth,
    from: () => query,
    rpc: async () => ({ data: null, error }),
    storage,
  }
}

export const supabase = isConfigured
  ? createBrowserClient(url, publishableKey)
  : createNoopBrowserClient()
