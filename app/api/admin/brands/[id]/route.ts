import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { name, slug, category_id, logo_path, description_md, status } = body || {}
    if (!name && !slug && !category_id && !logo_path && !description_md && !status) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })

    const updates: any = {}
    if (name) updates.name = name
    if (slug) updates.slug = slug
    if (category_id) updates.category_id = category_id
    if (logo_path !== undefined) updates.logo_path = logo_path
    if (description_md !== undefined) updates.description_md = description_md
    if (status) updates.status = status

    const { data, error } = await supabaseAdmin.from('brands').update(updates).eq('id', params.id).select('id, name, slug, status, category:categories(id, name), logo_path').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('brands').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { id: params.id } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}