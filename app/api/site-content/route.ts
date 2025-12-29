import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Parallel fetch for speed
    const [homeRes, trustRes, faqRes, brandsRes] = await Promise.all([
      supabaseAdmin.from('home_content').select('*').eq('id', 1).maybeSingle(),
      supabaseAdmin.from('trust_points').select('id, title, subtitle').order('sort_order'),
      supabaseAdmin.from('faqs').select('id, question, answer').order('sort_order'),
      supabaseAdmin.from('home_featured_brands').select('brand_slug')
    ])

    const home = homeRes.data || {}
    const trust_points = trustRes.data || []
    const faqs = faqRes.data || []
    const featured_brand_slugs = (brandsRes.data || []).map((b: any) => b.brand_slug)

    // Normalize response to match Frontend expectations (Old site_content shape)
    const response = {
      hero_title: home.hero_title ?? null,
      hero_subtitle: home.hero_subtitle ?? null,
      hero_banner_image: home.hero_banner_image ?? null,
      featured_brands_title: home.featured_brands_title ?? null,
      featured_brand_slugs,
      trust_points_title: home.trust_points_title ?? null,
      trust_points,
      faq_title: home.faq_title ?? null,
      faqs,
      whatsapp_number: home.whatsapp_number ?? null // Extra field, useful for footer
    }

    return NextResponse.json({ data: response })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
