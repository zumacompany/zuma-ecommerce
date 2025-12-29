import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'IDs array required' }, { status: 400 })
        }

        const { error } = await supabaseAdmin.from('orders').delete().in('id', ids)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
    }
}
