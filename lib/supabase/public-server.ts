import 'server-only'
import { createSupabasePublicClient } from '@/src/server/platform/db/supabase'

let _supabasePublic: ReturnType<typeof createSupabasePublicClient> | null = null

export function createPublicServerClient() {
  return createSupabasePublicClient()
}

export function getPublicClient() {
  return createPublicServerClient()
}

function getSupabasePublic() {
  if (!_supabasePublic) _supabasePublic = getPublicClient()
  return _supabasePublic
}

function shouldNotInitClient(prop: PropertyKey) {
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
export const supabasePublic = new Proxy(
  {},
  {
    get(_target, prop) {
      if (shouldNotInitClient(prop)) return undefined
      return (getSupabasePublic() as any)[prop]
    },
  }
) as ReturnType<typeof createSupabasePublicClient>
