import 'server-only'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | null = null

export function createClient() {
  return createSupabaseAdminClient()
}

function getSupabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = createClient()
  return _supabaseAdmin
}

function shouldNotInitClient(prop: PropertyKey) {
  // Some Next.js/React internals probe objects for these keys during build/prerender.
  // Initializing the client here would force env vars to exist at build time.
  return (
    prop === 'toJSON'
    || prop === 'then'
    || prop === 'catch'
    || prop === 'finally'
    || prop === 'inspect'
    || prop === Symbol.toStringTag
    || prop === Symbol.iterator
  )
}

// Lazily instantiate so `next build` can compile without Supabase env vars.
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      if (shouldNotInitClient(prop)) return undefined
      return (getSupabaseAdmin() as any)[prop]
    },
  }
) as ReturnType<typeof createSupabaseAdminClient>
