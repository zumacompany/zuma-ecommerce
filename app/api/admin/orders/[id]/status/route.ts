import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../../lib/supabase/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { status } = body || {}

    console.log('📥 Status update request:', { orderId: params.id, newStatus: status })

    if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 })

    // Use RPC for atomic update + history
    const { data, error } = await supabaseAdmin.rpc('update_order_status', {
      p_order_id: params.id,
      p_new_status: status,
      p_note: 'Updated from admin',
      p_changed_by: null // We don't have admin user ID context in this MVP yet
    })

    console.log('🔧 RPC result:', { data, error })

    if (error) {
      console.error('❌ RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Status updated successfully in database')
    return NextResponse.json({ success: true, updated: data })
  } catch (err: any) {
    console.error('❌ API error:', err)
    return NextResponse.json({ error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
