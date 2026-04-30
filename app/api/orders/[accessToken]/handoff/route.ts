import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { markPublicOrderHandoff } from '@/src/server/modules/orders/order-public.service'

export const POST = withRoute(async ({ params }) => {
  const result = await markPublicOrderHandoff(params.accessToken)
  return NextResponse.json(result)
})
