import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { deleteCustomer, updateCustomer } from '@/src/server/modules/customers/customer.service'

export const PATCH = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await updateCustomer(request, params.id)
  return NextResponse.json(result)
})

export const DELETE = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await deleteCustomer(request, params.id)
  return NextResponse.json(result)
})
