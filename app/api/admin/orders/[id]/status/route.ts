import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { updateOrderStatus } from '@/src/server/modules/orders/order-status.service'
import { requireAdmin } from '@/src/server/platform/auth/admin'

export const POST = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await updateOrderStatus(request, params.id)
  return NextResponse.json(result)
})
