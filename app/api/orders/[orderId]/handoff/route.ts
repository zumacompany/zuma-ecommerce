import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    // Try update by order_number first
    const { data: updated, error: updErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'on_hold', handoff_clicked_at: new Date().toISOString() })
      .eq('order_number', orderId)
      .select('id')
      .limit(1)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    let orderIdUuid = null
    if (Array.isArray(updated) && updated.length > 0) {
      orderIdUuid = updated[0].id
    } else {
      // try as uuid id
      const { data: updated2, error: updErr2 } = await supabaseAdmin
        .from('orders')
        .update({ status: 'on_hold', handoff_clicked_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('id')
        .limit(1)
      if (updErr2) return NextResponse.json({ error: updErr2.message }, { status: 500 })
      if (Array.isArray(updated2) && updated2.length > 0) orderIdUuid = updated2[0].id
    }

    if (!orderIdUuid) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // analytics: whatsapp_clicked
    await supabaseAdmin.from('analytics_events').insert([
      {
        session_id: null,
        event_name: 'whatsapp_clicked',
        order_id: orderIdUuid
      }
    ])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Error in handoff', err)
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
