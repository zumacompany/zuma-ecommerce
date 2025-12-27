import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    // include category name in response
    const { data, error } = await supabaseAdmin.from('brands').select('id, name, slug, status, logo_path, hero_image_path, description_md, category:categories(id, name)').order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, slug, category_id, logo_path, hero_image_path, description_md, status } = body || {}
    if (!name || !slug || !category_id) return NextResponse.json({ error: 'name, slug and category_id are required' }, { status: 400 })

    const insertObj: any = { name, slug, category_id }
    if (logo_path) insertObj.logo_path = logo_path
    if (hero_image_path) insertObj.hero_image_path = hero_image_path
    if (description_md) insertObj.description_md = description_md
    if (status) insertObj.status = status

    const { data, error } = await supabaseAdmin.from('brands').insert(insertObj).select('id, name, slug, status, category:categories(id, name), logo_path, hero_image_path').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
