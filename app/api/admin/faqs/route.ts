import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { listContentBlocks, upsertContentBlocks } from '@/src/server/modules/content/content-blocks.service'

export const dynamic = 'force-dynamic'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await listContentBlocks('faqs')
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await upsertContentBlocks(request, 'faqs')
  return NextResponse.json(result)
})
