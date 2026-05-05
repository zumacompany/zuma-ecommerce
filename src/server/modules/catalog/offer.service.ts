import 'server-only'
import { recordAdminAction } from '@/lib/auditLog'
import { CreateOfferSchema, UpdateOfferSchema } from '@/lib/validation/offer'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const OFFER_SELECT = 'id, brand_id, brand:brands(id,name,slug), region_code, denomination_value, denomination_currency, price, cost_price, status, stock_quantity, is_unlimited, auto_fulfill, product_id, show_when_out_of_stock'

export async function listOffers() {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('offers')
    .select(OFFER_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data: data ?? [] }
}

export async function createOffer(request: Request) {
  const rawPayload = await request.json()
  const payload = CreateOfferSchema.parse({
    ...rawPayload,
    denomination_value: Number(rawPayload?.denomination_value),
    price: Number(rawPayload?.price),
    cost_price: rawPayload?.cost_price !== undefined ? Number(rawPayload.cost_price) : undefined,
  })

  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('offers')
    .insert(payload)
    .select(OFFER_SELECT)
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data }
}

export async function updateOffer(request: Request, offerId: string) {
  const payload = UpdateOfferSchema.parse(await request.json())

  if (Object.keys(payload).length === 0) {
    throw new ValidationError('nothing to update')
  }

  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('offers')
    .update(payload)
    .eq('id', offerId)
    .select(OFFER_SELECT)
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'offer.update',
    resource_type: 'offer',
    resource_id: offerId,
    diff: payload,
  }, request)

  return { data }
}

export async function deleteOffer(request: Request, offerId: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('offers').delete().eq('id', offerId)

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'offer.delete',
    resource_type: 'offer',
    resource_id: offerId,
  }, request)

  return { data: { id: offerId } }
}
