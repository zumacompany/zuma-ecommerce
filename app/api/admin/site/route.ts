import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    const { data: homeRow, error: homeErr } = await supabaseAdmin.from('site_content').select('value').eq('key', 'home').limit(1).maybeSingle()
    if (homeErr) return NextResponse.json({ error: homeErr.message }, { status: 500 })

    const { data: siteRow, error: siteErr } = await supabaseAdmin.from('site_content').select('value').eq('key', 'site').limit(1).maybeSingle()
    if (siteErr) return NextResponse.json({ error: siteErr.message }, { status: 500 })

    return NextResponse.json({ data: { home: homeRow?.value ?? null, site: siteRow?.value ?? null } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, value } = body
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })

    // Upsert the site_content row with key and value
    const { data, error } = await supabaseAdmin.from('site_content').upsert({ key, value }).select('key, value').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
