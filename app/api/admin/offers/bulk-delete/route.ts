import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { bulkDeleteRecords } from '@/src/server/modules/catalog/bulk-actions.service'

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await bulkDeleteRecords(request, 'offers')
  return NextResponse.json(result)
})
