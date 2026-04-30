import 'server-only'
import { z } from 'zod'
import { ConflictError, ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'
import { isAdminUser } from '@/src/server/platform/auth/admin-role'

const BootstrapSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type AuthUserLike = {
  id: string
  email?: string | null
  app_metadata?: {
    role?: string
    roles?: string[]
  }
  user_metadata?: {
    role?: string
    roles?: string[]
  }
}

export async function getBootstrapStatus() {
  const adminClient = createSupabaseAdminClient()
  const {
    data: { users },
    error,
  } = await adminClient.auth.admin.listUsers()

  if (error) {
    throw new ConflictError(error.message)
  }

  return {
    hasAdmins: (users as AuthUserLike[]).some((user) => isAdminUser(user as any)),
  }
}

export async function signupAdmin(request: Request) {
  const payload = BootstrapSignupSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    app_metadata: {
      role: 'admin',
      roles: ['admin'],
    },
    user_metadata: {
      role: 'admin',
    },
  })

  if (createError) {
    throw new ValidationError(createError.message)
  }

  const createdUser = newUser.user

  if (createdUser) {
    await adminClient
      .from('admin_users')
      .upsert({ user_id: createdUser.id, role: 'admin' }, { onConflict: 'user_id' })
  }

  return {
    success: true,
    user: {
      id: createdUser?.id,
      email: createdUser?.email ?? null,
    },
  }
}
