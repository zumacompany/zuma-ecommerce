import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export async function GET() {
  try {
    // Expect a row with key = 'home' that holds page content in `value` jsonb
    const { data, error } = await supabaseAdmin.from('site_content').select('value').eq('key', 'home').limit(1).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const value = data?.value ?? null

    // Normalize response to include common fields
    const response = {
      hero_title: value?.hero_title ?? null,
      hero_subtitle: value?.hero_subtitle ?? null,
      hero_banner_image: value?.hero_banner_image ?? null,
      featured_brand_slugs: Array.isArray(value?.featured_brand_slugs) ? value.featured_brand_slugs : [],
      trust_points: Array.isArray(value?.trust_points) ? value.trust_points : [],
      faqs: Array.isArray(value?.faqs) ? value.faqs : []
    }

    return NextResponse.json({ data: response })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
