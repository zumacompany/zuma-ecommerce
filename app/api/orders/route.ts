import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // support legacy field names and new checkout fields
    const customer_name = body.name ?? body.customer_name
    const customer_email = body.email ?? body.customer_email
    const whatsappPrefix = body.whatsappPrefix ?? body.whatsapp_prefix ?? null
    const whatsappNumber = body.whatsappNumber ?? body.whatsapp_number ?? null
    const country = body.country ?? null
    const province = body.province ?? null

    const payment_method_id = body.payment_method_id
    const items = body.items
    const currency = body.currency
    const session_id = body.session_id

    if (!customer_name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'customer_name and items are required' }, { status: 400 })
    }

    // normalize whatsapp to e164 if prefix/number provided, else keep legacy value if present
    const digits = (s: any) => String(s ?? '').replace(/\D/g, '')
    let customer_whatsapp: string | null = null
    if (whatsappPrefix || whatsappNumber) {
      const pref = digits(whatsappPrefix)
      const num = digits(whatsappNumber)
      if (!pref || !num) return NextResponse.json({ error: 'Invalid whatsapp prefix/number' }, { status: 400 })
      customer_whatsapp = `+${pref}${num}`
    } else if (body.customer_whatsapp) {
      customer_whatsapp = body.customer_whatsapp
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

    // Upsert customer by WhatsApp (allows recurring customers)
    let customer_id: string | null = null
    try {
      const rpcIn: any = {
        p_whatsapp_e164: customer_whatsapp ?? null,
        p_whatsapp_display: customer_name, // default display name to customer provided name
        p_name: customer_name,
        p_email: customer_email ?? null,
        p_country: country,
        p_province: province,
        p_order_created_at: new Date().toISOString()
      }
      const { data: custData, error: custErr } = await supabaseAdmin.rpc('upsert_customer_by_whatsapp', rpcIn as any)
      if (custErr) return NextResponse.json({ error: custErr.message }, { status: 500 })
      const custRes = Array.isArray(custData) ? custData[0] : custData
      // The RPC returns returning id into cid; which is a scalar uuid if called via SQL, 
      // but via supabase-js RPC it might be returned directly or as an object depending on function definition.
      // Based on the schema 'returns uuid', it should return the string directly.
      customer_id = custRes
    } catch (err: any) {
      return NextResponse.json({ error: err?.message ?? 'customer upsert failed' }, { status: 500 })
    }

    // Call RPC create_order (atomic) — include customer_id and snapshot fields
    const rpcPayload = {
      p_customer_id: customer_id,
      p_customer_name: customer_name,
      p_customer_email: customer_email ?? null,
      p_customer_whatsapp: customer_whatsapp ?? null,
      p_payment_method_id: payment_method_id ?? null,
      p_payment_method_snapshot: payment_method_snapshot ? payment_method_snapshot : null,
      p_items: items, // Pass as array, Supabase will convert to JSONB
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
