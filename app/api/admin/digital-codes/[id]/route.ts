import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { deleteDigitalCode, updateDigitalCode } from '@/src/server/modules/catalog/digital-codes.service'

export const dynamic = 'force-dynamic'

export const PATCH = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await updateDigitalCode(request, params.id)
  return NextResponse.json(result)
})

export const DELETE = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await deleteDigitalCode(params.id)
  return NextResponse.json(result)
})
