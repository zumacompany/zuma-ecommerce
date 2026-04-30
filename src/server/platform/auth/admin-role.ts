import type { User } from '@supabase/supabase-js'

type AuthUserLike = Pick<User, 'app_metadata' | 'user_metadata'>

export function isAdminUser(user: AuthUserLike | null | undefined) {
  if (!user) return false

  const role = user.app_metadata?.role ?? user.user_metadata?.role
  const roles = user.app_metadata?.roles ?? user.user_metadata?.roles

  return role === 'admin' || (Array.isArray(roles) && roles.includes('admin'))
}
