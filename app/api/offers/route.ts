import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brand = searchParams.get('brand')
    const region = searchParams.get('region')

    if (!brand || !region) return NextResponse.json({ data: [] })

    const { data, error } = await supabaseAdmin.from('brands').select('id').eq('slug', brand).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ data: [] })

    const { data: offers, error: offersErr } = await supabaseAdmin.from('offers').select('id, region_code, denomination_value, denomination_currency, price').eq('brand_id', data.id).eq('region_code', region).eq('status', 'active').order('denomination_value')
    if (offersErr) return NextResponse.json({ error: offersErr.message }, { status: 500 })

    return NextResponse.json({ data: offers ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
