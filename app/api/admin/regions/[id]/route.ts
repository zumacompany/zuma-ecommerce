import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { deleteRegion, updateRegion } from '@/src/server/modules/catalog/region.service'

export const PATCH = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await updateRegion(request, params.id)
  return NextResponse.json(result)
})

export const DELETE = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await deleteRegion(params.id)
  return NextResponse.json(result)
})
