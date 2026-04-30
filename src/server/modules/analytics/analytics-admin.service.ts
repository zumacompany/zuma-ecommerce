import 'server-only'
import { z } from 'zod'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

function normalizeMetadata(metadata: unknown) {
  if (metadata === undefined) return undefined
  if (metadata === null) return null
  if (typeof metadata === 'string') {
    const trimmed = metadata.trim()
    if (!trimmed) return null
    try {
      return JSON.parse(trimmed)
    } catch {
      return { raw: metadata }
    }
  }
  return metadata
}

const CreateAnalyticsEventSchema = z.object({
  event_name: z.string().min(1),
  session_id: z.string().optional().nullable(),
  order_id: z.string().optional().nullable(),
  metadata: z.unknown().optional(),
})

const UpdateAnalyticsEventSchema = CreateAnalyticsEventSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'nothing to update'
)

export async function listAnalyticsEvents(request: Request) {
  const adminClient = createSupabaseAdminClient()
  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(Number(searchParams.get('limit')) || 100, 200))
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

  const { data, error, count } = await adminClient
    .from('analytics_events')
    .select('id, event_name, session_id, order_id, metadata, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new ValidationError(error.message)

  return { data: data ?? [], count: count ?? 0 }
}

export async function createAnalyticsEvent(request: Request) {
  const payload = CreateAnalyticsEventSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()

  const { data, error } = await adminClient
    .from('analytics_events')
    .insert({
      event_name: payload.event_name,
      session_id: payload.session_id || null,
      order_id: payload.order_id || null,
      metadata: normalizeMetadata(payload.metadata),
    })
    .select('id, event_name, session_id, order_id, metadata, created_at')
    .single()

  if (error) throw new ValidationError(error.message)

  return { data }
}

export async function updateAnalyticsEvent(request: Request, id: string) {
  const payload = UpdateAnalyticsEventSchema.parse(await request.json())
  const updates: Record<string, unknown> = {}
  if (payload.event_name !== undefined) updates.event_name = payload.event_name
  if (payload.session_id !== undefined) updates.session_id = payload.session_id || null
  if (payload.order_id !== undefined) updates.order_id = payload.order_id || null
  if (payload.metadata !== undefined) updates.metadata = normalizeMetadata(payload.metadata)

  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('analytics_events')
    .update(updates)
    .eq('id', id)
    .select('id, event_name, session_id, order_id, metadata, created_at')
    .single()

  if (error) throw new ValidationError(error.message)

  return { data }
}

export async function deleteAnalyticsEvent(id: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('analytics_events').delete().eq('id', id)
  if (error) throw new ValidationError(error.message)
  return { success: true }
}
