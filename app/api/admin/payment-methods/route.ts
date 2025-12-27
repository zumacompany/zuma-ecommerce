import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('payment_methods').select('id, name, type, instructions_md, details, status, sort_order').order('sort_order', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, type, instructions_md, details, status, sort_order } = body || {}
    if (!name || !type) return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
    if (!['manual','stripe','mpesa'].includes(type)) return NextResponse.json({ error: 'invalid type' }, { status: 400 })

    const sortNum = sort_order !== undefined ? Number(sort_order) : undefined
    if (sortNum !== undefined && (isNaN(sortNum) || sortNum < 0)) return NextResponse.json({ error: 'sort_order must be a non-negative number' }, { status: 400 })

    const sanitizedDetails: any = {}
    if (type === 'manual') {
      if (!details?.account_number || !details?.account_name) return NextResponse.json({ error: 'manual payment requires account_number and account_name in details' }, { status: 400 })
      sanitizedDetails.account_number = details.account_number
      sanitizedDetails.account_name = details.account_name
    }
    if (type === 'mpesa') {
      if (!details?.phone) return NextResponse.json({ error: 'mpesa requires phone in details' }, { status: 400 })
      sanitizedDetails.phone = details.phone
    }

    const insert: any = { name, type, instructions_md: instructions_md ?? null, details: Object.keys(sanitizedDetails).length ? sanitizedDetails : null }
    if (status) insert.status = status
    if (sortNum !== undefined) insert.sort_order = sortNum

    const { data, error } = await supabaseAdmin.from('payment_methods').insert(insert).select('id, name, type, instructions_md, details, status, sort_order').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
