import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { createAnalyticsEvent, listAnalyticsEvents } from '@/src/server/modules/analytics/analytics-admin.service'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await listAnalyticsEvents(request)
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createAnalyticsEvent(request)
  return NextResponse.json(result)
})
