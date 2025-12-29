import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const body = await req.json()
        const { name, code } = body

        if (!name && !code) {
            return NextResponse.json({ error: 'nothing to update' }, { status: 400 })
        }

        const updates: any = {}
        if (name) updates.name = name
        if (code) updates.code = code.toUpperCase()

        const { data, error } = await supabaseAdmin
            .from('regions')
            .update(updates)
            .eq('id', id)
            .select('id, name, code')
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const { error } = await supabaseAdmin.from('regions').delete().eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ ok: true })
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
    }
}
