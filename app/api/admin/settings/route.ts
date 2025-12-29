import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('site_content')
        .select('*')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Transform key-value array into a single settings object
    const settings = data.reduce((acc: any, item: any) => {
        acc[item.key] = item.value
        return acc
    }, {})

    return NextResponse.json(settings)
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { key, value } = body

        if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 })

        const { error } = await supabaseAdmin
            .from('site_content')
            .upsert({ key, value, updated_at: new Date().toISOString() })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
