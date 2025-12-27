import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabase/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { status } = body || {}
    if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 })

    // fetch order first
    const { data: order, error: orderErr } = await supabaseAdmin.from('orders').select('id, status').eq('id', params.id).maybeSingle()
    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })
    if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 })

    const previous = order.status
    const { data, error } = await supabaseAdmin.from('orders').update({ status }).eq('id', params.id).select('id, order_number, status').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // insert history
    const { error: hErr } = await supabaseAdmin.from('order_status_history').insert({ order_id: params.id, from_status: previous, to_status: status, note: 'Updated from admin' })
    if (hErr) {
      // non-fatal but report
      return NextResponse.json({ error: hErr.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
