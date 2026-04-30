import 'server-only'
import { z } from 'zod'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const BulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export async function bulkDeleteRecords(request: Request, table: 'customers' | 'offers') {
  const payload = BulkIdsSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from(table).delete().in('id', payload.ids)
  if (error) throw new ValidationError(error.message)
  return { success: true }
}
