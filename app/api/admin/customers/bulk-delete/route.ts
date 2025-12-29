import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { ids } = await request.json()

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('customers')
            .delete()
            .in('id', ids)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Bulk delete customers error:', err)
        return NextResponse.json(
            { error: err.message || 'Failed to delete customers' },
            { status: 500 }
        )
    }
}
