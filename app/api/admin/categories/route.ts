import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, color, icon, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, slug, color, icon } = body
    if (!name || !slug) return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ name, slug, color, icon }])
      .select('id, name, slug, color, icon, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    // Delete all categories by matching all IDs (using a condition that is always true for valid UUIDs)
    const { error } = await supabaseAdmin.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
