import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const body = await req.json()
        const { delivery_codes, admin_notes, updated_by_email } = body

        // Prepare updates
        const updates: any = {}
        if (delivery_codes !== undefined) updates.delivery_codes = delivery_codes
        if (admin_notes !== undefined) updates.admin_notes = admin_notes
        if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

        // Update Order
        const { error } = await supabaseAdmin.from('orders').update(updates).eq('id', id)
        if (error) throw error

        // Audit Log (if email provided)
        if (updated_by_email) {
            await supabaseAdmin.from('audit_logs').insert({
                admin_email: updated_by_email,
                action: 'updated_order_details',
                entity: 'orders',
                entity_id: id,
                details: updates
            })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const { error } = await supabaseAdmin.from('orders').delete().eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
    }
}
