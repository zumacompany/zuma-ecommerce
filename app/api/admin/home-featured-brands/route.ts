import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Return list of slugs ordered by sort_order
        const { data, error } = await supabaseAdmin
            .from('home_featured_brands')
            .select('brand_slug')
            .order('sort_order', { ascending: true })

        if (error) throw error
        return NextResponse.json({ data: data.map((d: any) => d.brand_slug) })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { slugs } = body // Accept an array of slugs

        if (!Array.isArray(slugs)) {
            return NextResponse.json({ error: 'Slugs array required' }, { status: 400 })
        }

        // 1. Clear existing
        const { error: delError } = await supabaseAdmin.from('home_featured_brands').delete().filter('brand_slug', 'neq', 'RESERVED_FALLBACK_IF_ANY')
        // Note: simplified delete all. If we have a lot of brands, we might want to be more selective, 
        // but for home featured brands (usually < 20) this is fine.
        await supabaseAdmin.from('home_featured_brands').delete().neq('brand_slug', '')

        if (delError) throw delError

        // 2. Insert new with sort_order
        if (slugs.length > 0) {
            const toInsert = slugs.map((slug, index) => ({
                brand_slug: slug,
                sort_order: index
            }))
            const { error: insError } = await supabaseAdmin.from('home_featured_brands').insert(toInsert)
            if (insError) throw insError
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
