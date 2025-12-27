import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { customer_name, customer_email, customer_whatsapp, payment_method_id, items, currency, session_id } = body

    if (!customer_name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'customer_name and items are required' }, { status: 400 })
    }

    // Fetch payment method snapshot (if provided)
    let payment_method_snapshot = null
    if (payment_method_id) {
      const { data: pm, error: pmErr } = await supabaseAdmin
        .from('payment_methods')
        .select('id, name, instructions_md, details')
        .eq('id', payment_method_id)
        .single()
      if (pmErr) return NextResponse.json({ error: 'Payment method not found' }, { status: 400 })
      payment_method_snapshot = pm
    }

    // Call RPC create_order (atomic)
    const rpcPayload = {
      p_customer_name: customer_name,
      p_customer_email: customer_email ?? null,
      p_customer_whatsapp: customer_whatsapp,
      p_payment_method_id: payment_method_id ?? null,
      p_payment_method_snapshot: payment_method_snapshot ? payment_method_snapshot : null,
      p_items: JSON.stringify(items),
      p_currency: currency ?? (items[0]?.currency ?? 'USD')
    }

    const { data, error } = await supabaseAdmin.rpc('create_order', rpcPayload as any)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const result = Array.isArray(data) ? data[0] : data
    const orderId = result?.order_id
    const orderNumber = result?.order_number

    // analytics event: order_created
    await supabaseAdmin.from('analytics_events').insert([
      {
        session_id: session_id ?? null,
        event_name: 'order_created',
        order_id: orderId,
        metadata: { items }
      }
    ])

    return NextResponse.json({ orderNumber })
  } catch (err: any) {
    console.error('Error creating order', err)
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
