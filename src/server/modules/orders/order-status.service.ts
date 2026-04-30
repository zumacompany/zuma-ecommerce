import 'server-only'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'
import { recordAdminAction } from '@/lib/auditLog'
import { UpdateOrderStatusSchema } from './order-status.schema'

export async function updateOrderStatus(request: Request, orderId: string) {
  const payload = UpdateOrderStatusSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()

  const { data, error } = await adminClient.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: payload.status,
    p_note: 'Updated from admin',
    p_changed_by: null,
  })

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction(
    {
      action: 'order.update_status',
      resource_type: 'order',
      resource_id: orderId,
      diff: { new_status: payload.status },
    },
    request
  )

  return {
    success: true,
    updated: data,
  }
}
