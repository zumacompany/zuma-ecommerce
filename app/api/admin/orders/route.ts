import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { createAdminOrder } from '@/src/server/modules/orders/order.service'
import { requireAdmin } from '@/src/server/platform/auth/admin'

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createAdminOrder(request)
  return NextResponse.json(result)
})
