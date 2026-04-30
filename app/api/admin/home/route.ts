import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { getHomeContent, updateHomeContent } from '@/src/server/modules/content/home-content.service'

export const dynamic = 'force-dynamic'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await getHomeContent()
  return NextResponse.json(result)
})

export const PATCH = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await updateHomeContent(request)
  return NextResponse.json(result)
})
