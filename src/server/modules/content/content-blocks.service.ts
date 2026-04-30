import 'server-only'
import { z } from 'zod'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const ContentItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  question: z.string().optional().nullable(),
  answer: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sort_order: z.number().optional().nullable(),
})

type ContentTable = 'faqs' | 'trust_points'

function getSelectColumns(table: ContentTable) {
  return table === 'faqs' ? '*' : '*'
}

export async function listContentBlocks(table: ContentTable) {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from(table)
    .select(getSelectColumns(table))
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new ValidationError(error.message)

  return { data }
}

export async function upsertContentBlocks(request: Request, table: ContentTable) {
  const body = await request.json()
  const adminClient = createSupabaseAdminClient()

  if (Array.isArray(body)) {
    const payload = z.array(ContentItemSchema).parse(body)
    const { error } = await adminClient.from(table).upsert(payload, { onConflict: 'id' })
    if (error) throw new ValidationError(error.message)
  } else {
    const payload = ContentItemSchema.parse(body)
    const { error } = await adminClient.from(table).insert(payload)
    if (error) throw new ValidationError(error.message)
  }

  return { success: true }
}

export async function updateContentBlock(request: Request, table: ContentTable, id: string) {
  const payload = ContentItemSchema.partial().parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from(table).update(payload).eq('id', id)
  if (error) throw new ValidationError(error.message)
  return { success: true }
}

export async function deleteContentBlock(table: ContentTable, id: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from(table).delete().eq('id', id)
  if (error) throw new ValidationError(error.message)
  return { success: true }
}
