import { NextResponse } from 'next/server'
import { supabasePublic } from '../../../lib/supabase/public-server'
import { apiError } from '../../../lib/api/response'

// Public endpoint that returns provinces with their cities for a given region.
// Replaces the previously-hardcoded MOZ_DATA dictionary in CheckoutClient.
// Cached at the edge for an hour since this dataset rarely changes.
export const revalidate = 3600

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const region = (searchParams.get('region') || 'MZ').toUpperCase()

    const { data, error } = await supabasePublic
      .from('provinces')
      .select('name, cities(name)')
      .eq('region_code', region)
      .order('name', { ascending: true })

    if (error) return apiError(error.message)

    const provinces = (data ?? []).map((p: any) => ({
      name: p.name,
      cities: ((p.cities ?? []) as Array<{ name: string }>)
        .map((c) => c.name)
        .sort((a, b) => a.localeCompare(b)),
    }))

    return NextResponse.json({ data: provinces })
  } catch (err: any) {
    return apiError(err?.message ?? 'unknown')
  }
}
