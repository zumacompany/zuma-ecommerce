import { NextResponse } from 'next/server'
import { withRoute } from '@/src/server/http/route'
import { getBootstrapStatus } from '@/src/server/modules/admins/bootstrap.service'

export const GET = withRoute(async () => {
  const result = await getBootstrapStatus()
  return NextResponse.json(result)
})
