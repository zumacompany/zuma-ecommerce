import 'server-only'
import { z } from 'zod'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const CreateDigitalCodeSchema = z.object({
  offer_id: z.string().uuid(),
  code_content: z.string().min(1),
})

const BulkDigitalCodesSchema = z.object({
  offer_id: z.string().uuid(),
  codes: z.array(z.string().min(1)).min(1),
})

const UpdateDigitalCodeSchema = z.object({
  status: z.string().min(1),
})

export async function listDigitalCodes(request: Request) {
  const adminClient = createSupabaseAdminClient()
  const { searchParams } = new URL(request.url)
  const offerId = searchParams.get('offer_id')
  const status = searchParams.get('status')

  let query = adminClient
    .from('digital_codes')
    .select(`
      id,
      offer_id,
      code_content,
      status,
      created_at,
      assigned_at,
      order_id,
      offers (
        id,
        denomination_value,
        denomination_currency,
        brands (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (offerId) query = query.eq('offer_id', offerId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw new ValidationError(error.message)
  return { data: data ?? [] }
}

export async function createDigitalCode(request: Request) {
  const payload = CreateDigitalCodeSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('digital_codes')
    .insert({
      offer_id: payload.offer_id,
      code_content: payload.code_content,
      status: 'available',
    })
    .select()
    .single()

  if (error) throw new ValidationError(error.message)
  return { data }
}

export async function bulkUploadDigitalCodes(request: Request) {
  const payload = BulkDigitalCodesSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const toInsert = payload.codes.map((code) => ({
    offer_id: payload.offer_id,
    code_content: code.trim(),
    status: 'available',
  }))

  const { data, error } = await adminClient.from('digital_codes').insert(toInsert).select()
  if (error) throw new ValidationError(error.message)

  return {
    success: true,
    count: data?.length ?? 0,
    data,
  }
}

export async function updateDigitalCode(request: Request, id: string) {
  const payload = UpdateDigitalCodeSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('digital_codes')
    .update({ status: payload.status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new ValidationError(error.message)
  return { data }
}

export async function deleteDigitalCode(id: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('digital_codes').delete().eq('id', id)
  if (error) throw new ValidationError(error.message)
  return { success: true }
}
