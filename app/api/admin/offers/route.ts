import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { createOffer, listOffers } from '@/src/server/modules/catalog/offer.service'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await listOffers()
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createOffer(request)
  return NextResponse.json(result)
})
