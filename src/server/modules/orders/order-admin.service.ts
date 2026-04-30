import 'server-only'
import { z } from 'zod'
import { recordAdminAction } from '@/lib/auditLog'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const UpdateOrderDetailsSchema = z.object({
  delivery_codes: z.string().optional(),
  admin_notes: z.string().optional(),
}).refine((payload) => Object.keys(payload).length > 0, 'No fields to update')

const BulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export async function updateOrderDetails(request: Request, id: string) {
  const payload = UpdateOrderDetailsSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('orders').update(payload).eq('id', id)
  if (error) throw new ValidationError(error.message)

  void recordAdminAction({
    action: 'order.update_details',
    resource_type: 'order',
    resource_id: id,
    diff: payload,
  }, request)

  return { success: true }
}

export async function deleteOrder(id: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('orders').delete().eq('id', id)
  if (error) throw new ValidationError(error.message)
  return { success: true }
}

export async function bulkDeleteOrders(request: Request) {
  const payload = BulkIdsSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('orders').delete().in('id', payload.ids)
  if (error) throw new ValidationError(error.message)

  void recordAdminAction({
    action: 'order.bulk_delete',
    resource_type: 'order',
    resource_id: null,
    diff: { ids: payload.ids, count: payload.ids.length },
  }, request)

  return { success: true }
}
