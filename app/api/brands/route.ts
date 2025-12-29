import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from('brands')
            .select('id, name, slug, logo_path, category_id')
            .eq('status', 'active')
            .order('name')

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ data: data ?? [] })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
    }
}
