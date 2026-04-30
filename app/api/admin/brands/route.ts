import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { createBrand, listBrands } from '@/src/server/modules/catalog/brand.service'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await listBrands()
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createBrand(request)
  return NextResponse.json(result)
})
