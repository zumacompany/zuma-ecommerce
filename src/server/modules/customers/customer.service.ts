import 'server-only'
import { z } from 'zod'
import { recordAdminAction } from '@/lib/auditLog'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  whatsapp_e164: z.string().min(1),
  country: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
})

const UpdateCustomerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  whatsapp_e164: z.string().optional(),
  country: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  status: z.string().optional(),
})

export async function listCustomers(request: Request) {
  const adminClient = createSupabaseAdminClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  let query = adminClient
    .from('customers')
    .select('*', { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,whatsapp_e164.ilike.%${q}%`)

  const { data, count, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data: data ?? [], count: count ?? 0 }
}

export async function createCustomer(request: Request) {
  const payload = CreateCustomerSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()

  const { data, error } = await adminClient
    .from('customers')
    .insert({
      name: payload.name,
      email: payload.email,
      whatsapp_e164: payload.whatsapp_e164,
      country: payload.country || 'Mozambique',
      province: payload.province || '',
      status: (payload.status || 'active').toLowerCase(),
    })
    .select()
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data }
}

export async function updateCustomer(request: Request, customerId: string) {
  const payload = UpdateCustomerSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const updates: Record<string, unknown> = {}

  if (payload.name !== undefined) updates.name = payload.name
  if (payload.email !== undefined) updates.email = payload.email
  if (payload.whatsapp_e164 !== undefined) updates.whatsapp_e164 = payload.whatsapp_e164
  if (payload.country !== undefined) updates.country = payload.country
  if (payload.province !== undefined) updates.province = payload.province
  if (payload.status !== undefined) updates.status = payload.status.toLowerCase()

  const { data, error } = await adminClient
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'customer.update',
    resource_type: 'customer',
    resource_id: customerId,
    diff: updates,
  }, request)

  return { data }
}

export async function deleteCustomer(request: Request, customerId: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient
    .from('customers')
    .delete()
    .eq('id', customerId)

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'customer.delete',
    resource_type: 'customer',
    resource_id: customerId,
  }, request)

  return { success: true }
}
