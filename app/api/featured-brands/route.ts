import { NextResponse } from 'next/server'
import { supabasePublic } from '../../../lib/supabase/public-server'
import { apiError } from '../../../lib/api/response'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Fetch featured brand slugs from home_featured_brands (ordered by sort_order)
    const { data: slugsData, error: slugsErr } = await supabasePublic
      .from('home_featured_brands')
      .select('brand_slug')
      .order('sort_order', { ascending: true })

    if (slugsErr) throw slugsErr
    const slugs = slugsData?.map((d: any) => d.brand_slug) || []

    // 2. Fetch section title from home_content
    const { data: home } = await supabasePublic
      .from('home_content')
      .select('featured_brands_title')
      .eq('id', 1)
      .maybeSingle()
    const title = home?.featured_brands_title || null

    if (slugs.length === 0) {
      return NextResponse.json({ data: [], title })
    }

    // 3. Fetch brands details — only active brands surface to the storefront.
    const { data: brandsRaw, error: brandsErr } = await supabasePublic
      .from('brands')
      .select('id, name, slug, logo_path')
      .in('slug', slugs)
      .eq('status', 'active')

    if (brandsErr) throw brandsErr

    // 4. Sort brands to match the order of slugs (not alphabetical!)
    const brands = slugs
      .map((slug: string) => brandsRaw?.find((b: any) => b.slug === slug))
      .filter(Boolean)

    return NextResponse.json({ data: brands ?? [], title })
  } catch (err: any) {
    console.error('Featured Brands API Error:', err)
    return apiError(err?.message ?? 'unknown')
  }
}
