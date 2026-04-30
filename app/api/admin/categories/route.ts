import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { requireAdmin } from '@/src/server/platform/auth/admin'
import { createCategory, deleteAllCategories, listCategories } from '@/src/server/modules/catalog/category.service'

export const dynamic = 'force-dynamic'

export const GET = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await listCategories()
  return NextResponse.json(result)
})

export const POST = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await createCategory(request)
  return NextResponse.json(result)
})

export const DELETE = withRoute(async ({ request }) => {
  await requireAdmin(request)
  const result = await deleteAllCategories()
  return NextResponse.json(result)
})
