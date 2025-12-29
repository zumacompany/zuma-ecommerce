import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        console.log(`[PATCH Customer] ID: ${params.id}, Body:`, body)
        const { name, email, whatsapp_e164, country, province, status } = body || {}

        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (email !== undefined) updates.email = email
        if (whatsapp_e164 !== undefined) updates.whatsapp_e164 = whatsapp_e164
        if (country !== undefined) updates.country = country
        if (province !== undefined) updates.province = province
        if (status !== undefined) updates.status = status.toLowerCase()

        const { data, error } = await supabaseAdmin
            .from('customers')
            .update(updates)
            .eq('id', params.id)
            .select()
            .maybeSingle()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (err: any) {
        console.error('Update customer error FULL:', err)
        return NextResponse.json(
            { error: err.message || 'Failed to update customer', fullError: JSON.stringify(err) },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { error } = await supabaseAdmin
            .from('customers')
            .delete()
            .eq('id', params.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Delete customer error:', err)
        return NextResponse.json(
            { error: err.message || 'Failed to delete customer' },
            { status: 500 }
        )
    }
}
