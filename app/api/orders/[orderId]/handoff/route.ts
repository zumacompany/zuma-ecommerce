import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  try {
      const { orderId } = params
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    // Find order by order_number or id to capture previous status
    let orderRecord: any = null
    const { data: foundByNumber, error: findErr } = await supabaseAdmin.from('orders').select('id, status').eq('order_number', orderId).maybeSingle()
    if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 })
    if (foundByNumber) {
      orderRecord = foundByNumber
    } else {
      const { data: foundById, error: findErr2 } = await supabaseAdmin.from('orders').select('id, status').eq('id', orderId).maybeSingle()
      if (findErr2) return NextResponse.json({ error: findErr2.message }, { status: 500 })
      if (foundById) orderRecord = foundById
    }

    if (!orderRecord) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const previousStatus = orderRecord.status ?? 'new'

    // Update order to on_hold and set handoff time
    const { data: updatedOrder, error: updErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'on_hold', handoff_clicked_at: new Date().toISOString() })
      .eq('id', orderRecord.id)
      .select('id')
      .limit(1)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

    const orderIdUuid = Array.isArray(updatedOrder) && updatedOrder.length > 0 ? updatedOrder[0].id : null
    if (!orderIdUuid) return NextResponse.json({ error: 'Could not update order' }, { status: 500 })

    // Insert order status history (from previousStatus -> on_hold)
    await supabaseAdmin.from('order_status_history').insert([
      {
        order_id: orderIdUuid,
        changed_by: null,
        from_status: previousStatus,
        to_status: 'on_hold',
        note: 'Customer WhatsApp handoff'
      }
    ])

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
