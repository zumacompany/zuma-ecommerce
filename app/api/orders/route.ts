import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { createPublicOrder } from '@/src/server/modules/orders/order.service'

export const POST = withRoute(async ({ request }) => {
  const result = await createPublicOrder(request)
  return NextResponse.json(result)
})
