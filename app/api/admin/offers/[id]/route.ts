import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { brand_id, region_code, denomination_currency, denomination_value, price, status } = body || {}
    if (!brand_id && !region_code && !denomination_currency && denomination_value === undefined && price === undefined && !status) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })

    const updates: any = {}
    if (brand_id) updates.brand_id = brand_id
    if (region_code) updates.region_code = region_code
    if (denomination_currency) updates.denomination_currency = denomination_currency
    if (denomination_value !== undefined) {
      const denomNum = Number(denomination_value)
      if (isNaN(denomNum) || denomNum <= 0) return NextResponse.json({ error: 'denomination_value must be a positive number' }, { status: 400 })
      updates.denomination_value = denomNum
    }
    if (price !== undefined) {
      const priceNum = Number(price)
      if (isNaN(priceNum) || priceNum <= 0) return NextResponse.json({ error: 'price must be a positive number' }, { status: 400 })
      updates.price = priceNum
    }
    if (status) updates.status = status

    const { data, error } = await supabaseAdmin.from('offers').update(updates).eq('id', params.id).select('id, brand:brands(id,name,slug), region_code, denomination_value, denomination_currency, price, status').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('offers').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { id: params.id } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}