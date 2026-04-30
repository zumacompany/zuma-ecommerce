import { NextResponse } from 'next/server'
import { supabasePublic } from '../../../lib/supabase/public-server'
import { AnalyticsEventSchema } from '../../../lib/validation/order'
import { apiBadRequest, apiError } from '../../../lib/api/response'
import { analyticsLimiter, getClientIp } from '../../../lib/api/rate-limit'

export async function POST(req: Request) {
  try {
    // Rate limit analytics events
    const ip = getClientIp(req)
    if (!analyticsLimiter.check(ip)) {
      return NextResponse.json({ ok: true }) // Silently drop — don't reveal rate-limiting to analytics
    }

    const body = await req.json()
    const parsed = AnalyticsEventSchema.safeParse(body)

    if (!parsed.success) {
      return apiBadRequest('Invalid event data')
    }

    const { event_name, path, metadata, session_id } = parsed.data

    const { error } = await supabasePublic.from('analytics_events').insert([{
      session_id: session_id ?? null,
      event_name,
      path: path ?? null,
      metadata: metadata ?? null,
    }])

    if (error) return apiError(error.message)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return apiError(err?.message ?? 'unknown')
  }
}
