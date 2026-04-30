import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { createAdminUser, listAdminUsers } from '@/src/server/modules/admins/admin-users.service'
import { requireAdmin } from '@/src/server/platform/auth/admin'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const users = await listAdminUsers()
  return NextResponse.json({ users })
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createAdminUser(request)
  return NextResponse.json(result, { status: 201 })
})
