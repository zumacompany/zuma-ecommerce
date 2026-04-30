import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { createPaymentMethod, listPaymentMethods } from '@/src/server/modules/payments/payment-method.service'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await listPaymentMethods()
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createPaymentMethod(request)
  return NextResponse.json(result)
})
