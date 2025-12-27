import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('offers').select('id, brand:brands(id,name,slug), region_code, denomination_value, denomination_currency, price, status').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { brand_id, region_code, denomination_currency, denomination_value, price, status } = body || {}
    if (!brand_id || !region_code || !denomination_currency || denomination_value === undefined || price === undefined) return NextResponse.json({ error: 'missing required fields' }, { status: 400 })

    const denomNum = Number(denomination_value)
    const priceNum = Number(price)
    if (isNaN(denomNum) || denomNum <= 0) return NextResponse.json({ error: 'denomination_value must be a positive number' }, { status: 400 })
    if (isNaN(priceNum) || priceNum <= 0) return NextResponse.json({ error: 'price must be a positive number' }, { status: 400 })

    const insertObj: any = { brand_id, region_code, denomination_currency, denomination_value: denomNum, price: priceNum }
    if (status) insertObj.status = status

    const { data, error } = await supabaseAdmin.from('offers').insert(insertObj).select('id, brand:brands(id,name,slug), region_code, denomination_value, denomination_currency, price, status').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}