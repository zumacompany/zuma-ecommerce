import 'server-only'
import { z } from 'zod'
import { ConflictError, ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'
import { isAdminUser } from '@/src/server/platform/auth/admin-role'

const CreateAdminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type AdminAuthUser = {
  id: string
  email?: string | null
  created_at?: string
  last_sign_in_at?: string | null
  app_metadata?: {
    role?: string
    roles?: string[]
  }
  user_metadata?: {
    role?: string
    roles?: string[]
  }
}

export async function listAdminUsers() {
  const adminClient = createSupabaseAdminClient()
  const {
    data: { users },
    error,
  } = await adminClient.auth.admin.listUsers()

  if (error) {
    throw new ConflictError(error.message)
  }

  return (users as AdminAuthUser[])
    .filter((user) => isAdminUser(user as any))
    .map((user) => ({
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
    }))
}

export async function createAdminUser(request: Request) {
  const payload = CreateAdminUserSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()

  const { data, error } = await adminClient.auth.admin.createUser({
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

  if (error) {
    throw new ValidationError(error.message)
  }

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
      created_at: data.user.created_at ?? null,
    },
  }
}
