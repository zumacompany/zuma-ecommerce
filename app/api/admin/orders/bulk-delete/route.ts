import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { bulkDeleteOrders } from '@/src/server/modules/orders/order-admin.service'

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await bulkDeleteOrders(request)
  return NextResponse.json(result)
})
