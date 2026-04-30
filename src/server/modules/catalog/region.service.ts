import 'server-only'
import { z } from 'zod'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const RegionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
})

const UpdateRegionSchema = RegionSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'nothing to update'
)

export async function listRegions() {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('regions')
    .select('id, name, code, created_at')
    .order('name')

  if (error) throw new ValidationError(error.message)

  return { data: data ?? [] }
}

export async function createRegion(request: Request) {
  const payload = RegionSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('regions')
    .insert([{ name: payload.name, code: payload.code.toUpperCase() }])
    .select('id, name, code')
    .single()

  if (error) throw new ValidationError(error.message)

  return { data }
}

export async function updateRegion(request: Request, regionId: string) {
  const payload = UpdateRegionSchema.parse(await request.json())
  const updates: Record<string, unknown> = {}
  if (payload.name !== undefined) updates.name = payload.name
  if (payload.code !== undefined) updates.code = payload.code.toUpperCase()

  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('regions')
    .update(updates)
    .eq('id', regionId)
    .select('id, name, code')
    .single()

  if (error) throw new ValidationError(error.message)

  return { data }
}

export async function deleteRegion(regionId: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('regions').delete().eq('id', regionId)
  if (error) throw new ValidationError(error.message)
  return { ok: true }
}
