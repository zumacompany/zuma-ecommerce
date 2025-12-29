import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export async function GET() {
    try {
        // Fetch random active offers. 
        // Note: Supabase random() support depends on extension, so we might just fetch a limit and shuffle or order by created_at.
        // For now, let's fetch active offers and join with brands.

        const { data, error } = await supabaseAdmin
            .from('offers')
            .select('id, price, denomination_value, denomination_currency, brand_id, brands(id, name, slug, logo_path)')
            .eq('status', 'active')
            .limit(12) // Fetch enough for a good grid
        // .order('popularity', { ascending: false }) // If we had popularity

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Filter out offers where brand might be missing (soft delete case)
        const validOffers = data?.filter((o: any) => o.brands) ?? []

        return NextResponse.json({ data: validOffers })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
    }
}
