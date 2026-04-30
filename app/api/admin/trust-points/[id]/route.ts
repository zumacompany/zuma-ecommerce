import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { deleteContentBlock, updateContentBlock } from '@/src/server/modules/content/content-blocks.service'

export const PATCH = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await updateContentBlock(request, 'trust_points', params.id)
  return NextResponse.json(result)
})

export const DELETE = withRoute(async ({ request, params }) => {
  await requireAdmin(request)
  const result = await deleteContentBlock('trust_points', params.id)
  return NextResponse.json(result)
})
