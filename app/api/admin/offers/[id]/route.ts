import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { deleteOffer, updateOffer } from '@/src/server/modules/catalog/offer.service'

export const PATCH = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await updateOffer(request, params.id)
  return NextResponse.json(result)
})

export const DELETE = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await deleteOffer(request, params.id)
  return NextResponse.json(result)
})
