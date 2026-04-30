import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { deleteAnalyticsEvent, updateAnalyticsEvent } from '@/src/server/modules/analytics/analytics-admin.service'

export const PATCH = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await updateAnalyticsEvent(request, params.id)
  return NextResponse.json(result)
})

export const DELETE = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await deleteAnalyticsEvent(params.id)
  return NextResponse.json(result)
})
