import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { getSiteSettings, upsertSiteSetting } from '@/src/server/modules/content/site-settings.service'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await getSiteSettings()
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await upsertSiteSetting(request)
  return NextResponse.json(result)
})
