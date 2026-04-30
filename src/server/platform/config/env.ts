import 'server-only'
import { z } from 'zod'

const baseSchema = z.object({
  // Optional at build time; validated at call sites (getPublicSupabaseEnv / getServiceRoleSupabaseEnv).
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ADMIN_SIGNUP_SECRET: z.string().min(1).optional(),
  ORDER_PUBLIC_TOKEN_SECRET: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const parsed = baseSchema.safeParse(process.env)

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`)
}

const env = parsed.data

export function getPublicSupabaseEnv(): { url: string; key: string } {
  const url = env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL.')

  const key =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!key) {
    throw new Error(
      'Missing Supabase public key. Expected NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  return { url, key }
}

export function getServiceRoleSupabaseEnv(): { url: string; serviceRoleKey: string } {
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL fallback).')

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.')
  }

  return {
    url,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export function getAdminSignupSecret() {
  return env.ADMIN_SIGNUP_SECRET
}

export function getOrderPublicTokenSecret() {
  const secret = env.ORDER_PUBLIC_TOKEN_SECRET ?? env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error('Missing ORDER_PUBLIC_TOKEN_SECRET (or SUPABASE_SERVICE_ROLE_KEY fallback).')
  }

  return secret
}

export function isProduction() {
  return env.NODE_ENV === 'production'
}
