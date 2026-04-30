import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { deletePaymentMethod, updatePaymentMethod } from '@/src/server/modules/payments/payment-method.service'

export const PATCH = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await updatePaymentMethod(request, params.id)
  return NextResponse.json(result)
})

export const DELETE = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await deletePaymentMethod(request, params.id)
  return NextResponse.json(result)
})
