import { NextResponse } from 'next/server'
import { apiError } from '../../../lib/api/response'
import { getPublicSiteContent } from '@/src/server/modules/content/public-site-content.service'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getPublicSiteContent()
    return NextResponse.json({ data })
  } catch (err: any) {
    return apiError(err?.message ?? 'unknown')
  }
}
