import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Fetch featured brand slugs from home_featured_brands
    const { data: slugsData, error: slugsErr } = await supabaseAdmin.from('home_featured_brands').select('brand_slug')
    if (slugsErr) throw slugsErr
    const slugs = slugsData?.map((d: any) => d.brand_slug) || []

    // 2. Fetch section title from home_content
    const { data: home, error: homeErr } = await supabaseAdmin.from('home_content').select('featured_brands_title').eq('id', 1).maybeSingle()
    const title = home?.featured_brands_title || null

    if (slugs.length === 0) {
      return NextResponse.json({ data: [], title })
    }

    // 3. Fetch brands details
    const { data: brands, error: brandsErr } = await supabaseAdmin
      .from('brands')
      .select('id, name, slug, logo_path')
      .in('slug', slugs)
      .order('name')

    if (brandsErr) throw brandsErr

    return NextResponse.json({ data: brands ?? [], title })
  } catch (err: any) {
    console.error('Featured Brands API Error:', err)
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
