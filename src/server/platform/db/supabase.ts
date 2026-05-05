import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPublicSupabaseEnv, getServiceRoleSupabaseEnv } from '../config/env'

export type SupabaseLikeClient = {
  from: (table: string) => any
  rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: any; error: any }>
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getServiceRoleSupabaseEnv()

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}

export function createSupabasePublicClient() {
  const { url, key } = getPublicSupabaseEnv()

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

export async function createSupabaseServerSessionClient() {
  const { url, key } = getPublicSupabaseEnv()
  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(_name: string, _value: string, _options: CookieOptions) {},
      remove(_name: string, _options: CookieOptions) {},
    },
  })
}

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createSupabaseServerSessionClient()
  const { data, error } = await supabase.auth.getUser()

  if (error) return null

  return data.user ?? null
}
