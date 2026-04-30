import { NextResponse } from 'next/server'
import { supabasePublic } from '../../../lib/supabase/public-server'
import { apiError } from '../../../lib/api/response'

export async function GET() {
  try {
    const { data, error } = await supabasePublic
      .from('offers')
      .select('id, price, denomination_value, denomination_currency, brand_id, brands(id, name, slug, logo_path)')
      .eq('status', 'active')
      .limit(12)

    if (error) return apiError(error.message)

    // Filter out offers where brand might be missing (soft delete case)
    const validOffers = data?.filter((o: any) => o.brands) ?? []

    return NextResponse.json({ data: validOffers })
  } catch (err: any) {
    return apiError(err?.message ?? 'unknown')
  }
}
