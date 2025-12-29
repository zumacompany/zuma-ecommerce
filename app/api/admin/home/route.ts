import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin.from('home_content').select('*').eq('id', 1).maybeSingle()
        if (error) throw error
        return NextResponse.json({ data })
    } catch (err: any) {
        // If row doesn't exist (seed failed?), return empty or init
        return NextResponse.json({ data: {} })
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { error } = await supabaseAdmin.from('home_content').upsert({ ...body, id: 1 })
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
