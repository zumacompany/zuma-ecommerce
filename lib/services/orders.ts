import 'server-only'
import type { CreateOrderInput } from '../validation/order'

/**
 * Order service — centralizes all order-related business logic.
 *
 * Used by both public checkout (/api/orders) and admin order creation
 * (/api/admin/orders), eliminating the duplicated logic that existed before.
 */

type SupabaseClient = {
  from: (table: string) => any
  rpc: (fn: string, params: any) => any
}

type CreateOrderResult = {
  orderId: string
  orderNumber: string
}

/**
 * Normalize whatsapp input into E.164 format.
 * Accepts either prefix+number or a pre-formatted string.
 */
export function normalizeWhatsapp(input: {
  whatsapp_prefix?: string | null
  whatsapp_number?: string | null
  customer_whatsapp?: string | null
}): string | null {
  const digits = (s: any) => String(s ?? '').replace(/\D/g, '')

  if (input.whatsapp_prefix || input.whatsapp_number) {
    const pref = digits(input.whatsapp_prefix)
    const num = digits(input.whatsapp_number)

    if (!pref || !num) {
      throw new Error('Invalid whatsapp prefix/number')
    }
    if (num.length < 9 || num.length > 15) {
      throw new Error('Invalid phone number length')
    }

    return `+${pref}${num}`
  }

  return input.customer_whatsapp || null
}

/**
 * Verify that the client-submitted unit prices match the actual database prices.
 * This prevents price manipulation attacks.
 */
export async function verifyItemPrices(
  supabase: SupabaseClient,
  items: CreateOrderInput['items']
): Promise<void> {
  const offerIds = items.map((item) => item.offer_id)

  const { data: offers, error } = await supabase
    .from('offers')
    .select('id, price, status')
    .in('id', offerIds)

  if (error) throw new Error(`Failed to verify prices: ${error.message}`)

  const offerMap = new Map(
    (offers ?? []).map((o: any) => [o.id, o])
  )

  for (const item of items) {
    const offer = offerMap.get(item.offer_id)
    if (!offer) {
      throw new Error(`Offer ${item.offer_id} not found`)
    }
    if ((offer as any).status !== 'active') {
      throw new Error(`Offer ${item.offer_id} is not active`)
    }
    // Allow a tiny floating-point tolerance
    if (Math.abs(Number((offer as any).price) - item.unit_price) > 0.01) {
      throw new Error(
        `Price mismatch for offer ${item.offer_id}: expected ${(offer as any).price}, received ${item.unit_price}`
      )
    }
  }
}

/**
 * Fetch payment method snapshot for embedding in the order.
 */
export async function getPaymentMethodSnapshot(
  supabase: SupabaseClient,
  paymentMethodId: string
) {
  const { data: pm, error } = await supabase
    .from('payment_methods')
    .select('id, name, instructions_md, details')
    .eq('id', paymentMethodId)
    .single()

  if (error) throw new Error('Payment method not found')
  return pm
}

/**
 * Upsert customer by WhatsApp number.
 * Returns the customer UUID.
 */
export async function upsertCustomer(
  supabase: SupabaseClient,
  input: {
    customer_whatsapp: string | null
    customer_name: string
    customer_email: string | null
    country: string | null
    province: string | null
    city: string | null
    birthdate: string | null
  }
): Promise<string | null> {
  const rpcIn = {
    p_whatsapp_e164: input.customer_whatsapp,
    p_whatsapp_display: input.customer_name,
    p_name: input.customer_name,
    p_email: input.customer_email,
    p_country: input.country,
    p_province: input.province,
    p_city: input.city,
    p_birthdate: input.birthdate,
    p_order_created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.rpc('upsert_customer_by_whatsapp', rpcIn)
  if (error) throw new Error(error.message)

  return Array.isArray(data) ? data[0] : data
}

/**
 * Create an order using the atomic create_order RPC.
 * This is the single canonical path for order creation.
 */
export async function createOrder(
  supabase: SupabaseClient,
  input: {
    customerId: string | null
    customerName: string
    customerEmail: string | null
    customerWhatsapp: string | null
    paymentMethodId: string | null
    paymentMethodSnapshot: any
    items: CreateOrderInput['items']
    currency: string
  }
): Promise<CreateOrderResult> {
  const rpcPayload = {
    p_customer_id: input.customerId,
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_whatsapp: input.customerWhatsapp,
    p_payment_method_id: input.paymentMethodId,
    p_payment_method_snapshot: input.paymentMethodSnapshot,
    p_items: input.items,
    p_currency: input.currency,
  }

  const { data, error } = await supabase.rpc('create_order', rpcPayload)
  if (error) throw new Error(error.message)

  const result = Array.isArray(data) ? data[0] : data
  return {
    orderId: result?.order_id,
    orderNumber: result?.order_number,
  }
}

/**
 * Record an analytics event (fire-and-forget).
 */
export async function recordAnalyticsEvent(
  supabase: SupabaseClient,
  event: {
    session_id?: string | null
    event_name: string
    order_id?: string | null
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert([
      {
        session_id: event.session_id ?? null,
        event_name: event.event_name,
        order_id: event.order_id ?? null,
        metadata: event.metadata ?? {},
      },
    ])
  } catch {
    // Analytics failures must never block the main operation
    console.error('[analytics] failed to record event:', event.event_name)
  }
}
