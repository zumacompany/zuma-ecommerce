import { NextResponse } from 'next/server'
import { supabasePublic } from '../../../lib/supabase/public-server'
import { apiError } from '../../../lib/api/response'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const brand = searchParams.get('brand')
    const region = searchParams.get('region')

    if (!brand || !region) return NextResponse.json({ data: [] })

    // Single round-trip: join offers → brands and filter by brand slug, dropping
    // the prior brand-lookup query (was N+1).
    const { data: offers, error: offersErr } = await supabasePublic
      .from('offers')
      .select('id, region_code, denomination_value, denomination_currency, price, brands!inner(slug)')
      .eq('brands.slug', brand)
      .eq('region_code', region)
      .eq('status', 'active')
      .order('denomination_value')
    if (offersErr) return apiError(offersErr.message)

    // Strip the joined brand object from the response shape to keep clients unchanged.
    const cleaned = (offers ?? []).map(({ brands, ...rest }: any) => rest)
    return NextResponse.json({ data: cleaned })
  } catch (err: any) {
    return apiError(err?.message ?? 'unknown')
  }
}
