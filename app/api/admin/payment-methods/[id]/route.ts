import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { name, type, instructions_md, details, status, sort_order } = body || {}
    if (name === undefined && type === undefined && instructions_md === undefined && details === undefined && status === undefined && sort_order === undefined) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })

    const updates: any = {}
    if (name) updates.name = name
    if (type) {
      if (!['manual','stripe','mpesa'].includes(type)) return NextResponse.json({ error: 'invalid type' }, { status: 400 })
      updates.type = type
    }
    if (instructions_md !== undefined) updates.instructions_md = instructions_md
    if (status) updates.status = status
    if (sort_order !== undefined) {
      const sortNum = Number(sort_order)
      if (isNaN(sortNum) || sortNum < 0) return NextResponse.json({ error: 'sort_order must be a non-negative number' }, { status: 400 })
      updates.sort_order = sortNum
    }

    if (details !== undefined) {
      const sanitizedDetails: any = {}
      if (updates.type === 'manual' || (updates.type === undefined && details?.account_number)) {
        if (!details?.account_number || !details?.account_name) return NextResponse.json({ error: 'manual payment requires account_number and account_name in details' }, { status: 400 })
        sanitizedDetails.account_number = details.account_number
        sanitizedDetails.account_name = details.account_name
      }
      if (updates.type === 'mpesa' || (updates.type === undefined && details?.phone)) {
        if (!details?.phone) return NextResponse.json({ error: 'mpesa requires phone in details' }, { status: 400 })
        sanitizedDetails.phone = details.phone
      }
      updates.details = Object.keys(sanitizedDetails).length ? sanitizedDetails : null
    }

    const { data, error } = await supabaseAdmin.from('payment_methods').update(updates).eq('id', params.id).select('id, name, type, instructions_md, details, status, sort_order').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('payment_methods').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { id: params.id } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
