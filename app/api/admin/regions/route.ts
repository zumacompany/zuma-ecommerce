import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { createRegion, listRegions } from '@/src/server/modules/catalog/region.service'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await listRegions()
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createRegion(request)
  return NextResponse.json(result)
})
