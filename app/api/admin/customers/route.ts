import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { createCustomer, listCustomers } from '@/src/server/modules/customers/customer.service'

export const dynamic = 'force-dynamic'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await listCustomers(request)
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createCustomer(request)
  return NextResponse.json(result)
})
