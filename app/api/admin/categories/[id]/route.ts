import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    console.log('[PATCH] /api/admin/categories/[id] hit', params)
    const { id } = params
    const body = await req.json()
    console.log('[PATCH] Body:', body)
    const { name, slug, color, icon } = body
    if (!name && !slug && !color && !icon) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })

    const updates: any = {}
    if (name) updates.name = name
    if (slug) updates.slug = slug
    if (color) updates.color = color
    if (icon) updates.icon = icon

    const { data, error } = await supabaseAdmin.from('categories').update(updates).eq('id', id).select('id, name, slug, color, icon').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)

    if (error) {
      // Postgres error code 23503 is foreign_key_violation
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Não é possível apagar esta categoria porque existem marcas ou produtos associados a ela. Remova as associações primeiro.' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
