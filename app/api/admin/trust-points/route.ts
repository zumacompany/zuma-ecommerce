import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin.from('trust_points').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true })
        if (error) throw error
        return NextResponse.json({ data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        // Support batch upsert or single insert
        if (Array.isArray(body)) {
            const { error } = await supabaseAdmin.from('trust_points').upsert(body, { onConflict: 'id' })
            if (error) throw error
        } else {
            const { error } = await supabaseAdmin.from('trust_points').insert(body)
            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
