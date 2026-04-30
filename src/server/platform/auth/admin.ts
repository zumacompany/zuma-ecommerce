import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createSupabaseAdminClient, getSessionUser } from '../db/supabase'
import { ForbiddenError, UnauthorizedError } from '@/src/server/http/errors'
import { isAdminUser } from './admin-role'

export async function resolveRequestUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  const adminClient = createSupabaseAdminClient()

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length)
    const { data, error } = await adminClient.auth.getUser(token)

    if (error) return null

    return data.user ?? null
  }

  return getSessionUser()
}

export async function requireAdmin(request: Request) {
  const user = await resolveRequestUser(request)

  if (!user) {
    throw new UnauthorizedError()
  }

  if (!isAdminUser(user)) {
    throw new ForbiddenError('Admin access required')
  }

  return user
}
