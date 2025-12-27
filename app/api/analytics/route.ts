import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { session_id = null, event_name, path = null, metadata = null } = body
    if (!event_name) return NextResponse.json({ error: 'event_name is required' }, { status: 400 })

    const payload = {
      session_id: session_id ?? null,
      event_name,
      path,
      metadata: metadata ?? null
    }

    const { error } = await supabaseAdmin.from('analytics_events').insert([payload])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
