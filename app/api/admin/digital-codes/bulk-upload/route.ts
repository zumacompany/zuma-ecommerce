import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { bulkUploadDigitalCodes } from '@/src/server/modules/catalog/digital-codes.service'

export const dynamic = 'force-dynamic'

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await bulkUploadDigitalCodes(request)
  return NextResponse.json(result)
})
