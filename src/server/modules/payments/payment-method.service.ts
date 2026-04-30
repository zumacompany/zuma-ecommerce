import 'server-only'
import { z } from 'zod'
import { recordAdminAction } from '@/lib/auditLog'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const PaymentMethodTypeSchema = z.enum(['manual', 'stripe', 'mpesa'])
const PaymentMethodStatusSchema = z.enum(['active', 'inactive']).optional()

const PaymentMethodBaseSchema = z.object({
  name: z.string().min(1).optional(),
  type: PaymentMethodTypeSchema.optional(),
  instructions_md: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
  status: PaymentMethodStatusSchema,
  sort_order: z.coerce.number().int().min(0).optional(),
})

const CreatePaymentMethodSchema = PaymentMethodBaseSchema.extend({
  name: z.string().min(1),
  type: PaymentMethodTypeSchema,
})

const UpdatePaymentMethodSchema = PaymentMethodBaseSchema.refine(
  (payload) => Object.keys(payload).length > 0,
  'nothing to update'
)

const PAYMENT_METHOD_SELECT = 'id, name, type, instructions_md, details, status, sort_order'

function sanitizeDetails(type: 'manual' | 'stripe' | 'mpesa', details: Record<string, unknown> | null | undefined) {
  if (!details) return null

  const sanitizedDetails: Record<string, unknown> = {}

  if (type === 'manual') {
    if (!details.account_number || !details.account_name) {
      throw new ValidationError('manual payment requires account_number and account_name in details')
    }
    sanitizedDetails.account_number = details.account_number
    sanitizedDetails.account_name = details.account_name
  }

  if (type === 'mpesa') {
    if (!details.phone) {
      throw new ValidationError('mpesa requires phone in details')
    }
    sanitizedDetails.phone = details.phone
  }

  return Object.keys(sanitizedDetails).length ? sanitizedDetails : null
}

export async function listPaymentMethods() {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('payment_methods')
    .select(PAYMENT_METHOD_SELECT)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data: data ?? [] }
}

export async function createPaymentMethod(request: Request) {
  const payload = CreatePaymentMethodSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()

  const insert = {
    name: payload.name,
    type: payload.type,
    instructions_md: payload.instructions_md ?? null,
    details: sanitizeDetails(payload.type, payload.details),
    status: payload.status,
    sort_order: payload.sort_order,
  }

  const { data, error } = await adminClient
    .from('payment_methods')
    .insert(insert)
    .select(PAYMENT_METHOD_SELECT)
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'payment_method.create',
    resource_type: 'payment_method',
    resource_id: data?.id,
    diff: insert,
  }, request)

  return { data }
}

export async function updatePaymentMethod(request: Request, paymentMethodId: string) {
  const payload = UpdatePaymentMethodSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const updates: Record<string, unknown> = {}

  if (payload.name !== undefined) updates.name = payload.name
  if (payload.type !== undefined) updates.type = payload.type
  if (payload.instructions_md !== undefined) updates.instructions_md = payload.instructions_md
  if (payload.status !== undefined) updates.status = payload.status
  if (payload.sort_order !== undefined) updates.sort_order = payload.sort_order
  if (payload.details !== undefined) {
    const detailsType = (payload.type ?? 'manual') as 'manual' | 'stripe' | 'mpesa'
    updates.details = sanitizeDetails(detailsType, payload.details)
  }

  const { data, error } = await adminClient
    .from('payment_methods')
    .update(updates)
    .eq('id', paymentMethodId)
    .select(PAYMENT_METHOD_SELECT)
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'payment_method.update',
    resource_type: 'payment_method',
    resource_id: paymentMethodId,
    diff: updates,
  }, request)

  return { data }
}

export async function deletePaymentMethod(request: Request, paymentMethodId: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('payment_methods').delete().eq('id', paymentMethodId)

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'payment_method.delete',
    resource_type: 'payment_method',
    resource_id: paymentMethodId,
  }, request)

  return { data: { id: paymentMethodId } }
}
