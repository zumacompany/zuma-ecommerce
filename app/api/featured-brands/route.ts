import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export async function GET() {
  try {
    // Read featured_brand_slugs from site_content (key = 'home')
    const { data: sc, error: scErr } = await supabaseAdmin.from('site_content').select('value').eq('key', 'home').limit(1).maybeSingle()
    if (scErr) return NextResponse.json({ error: scErr.message }, { status: 500 })
    const slugs = Array.isArray(sc?.value?.featured_brand_slugs) ? sc.value.featured_brand_slugs : []

    if (!slugs || slugs.length === 0) return NextResponse.json({ data: [] })

    const { data, error } = await supabaseAdmin.from('brands').select('id, name, slug, logo_path').in('slug', slugs).order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
