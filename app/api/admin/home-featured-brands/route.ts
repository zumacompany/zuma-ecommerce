import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { getFeaturedBrandSlugs, updateFeaturedBrandSlugs } from '@/src/server/modules/content/home-content.service'

export const dynamic = 'force-dynamic'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await getFeaturedBrandSlugs()
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await updateFeaturedBrandSlugs(request)
  return NextResponse.json(result)
})
