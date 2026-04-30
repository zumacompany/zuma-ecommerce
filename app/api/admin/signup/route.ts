import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { signupAdmin } from '@/src/server/modules/admins/bootstrap.service'

export const POST = withRoute(async ({ request }) => {
  const result = await signupAdmin(request)
  return NextResponse.json(result, { status: 201 })
})
