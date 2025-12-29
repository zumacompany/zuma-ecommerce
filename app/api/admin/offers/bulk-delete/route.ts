import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { ids } = await request.json()

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('offers')
            .delete()
            .in('id', ids)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Bulk delete offers error:', err)
        return NextResponse.json(
            { error: err.message || 'Falha ao excluir ofertas' },
            { status: 500 }
        )
    }
}
