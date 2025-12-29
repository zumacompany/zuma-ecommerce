import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, whatsapp_e164, country, province, status } = body || {}

        if (!name || !email || !whatsapp_e164) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('customers')
            .insert({
                name,
                email,
                whatsapp_e164,
                country: country || 'Mozambique',
                province: province || '',
                status: (status || 'active').toLowerCase()
            })
            .select()
            .maybeSingle()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (err: any) {
        console.error('Create customer error:', err)
        return NextResponse.json(
            { error: err.message || 'Failed to create customer' },
            { status: 500 }
        )
    }
}
