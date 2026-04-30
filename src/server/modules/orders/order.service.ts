import 'server-only'
import { CreateOrderSchema, type CreateOrderInput } from '@/lib/validation/order'
import { getClientIp, orderLimiter } from '@/lib/api/rate-limit'
import {
  createOrder,
  getPaymentMethodSnapshot,
  normalizeWhatsapp,
  recordAnalyticsEvent,
  upsertCustomer,
  verifyItemPrices,
} from '@/lib/services/orders'
import {
  ConflictError,
  TooManyRequestsError,
  ValidationError,
} from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'
import { createPublicOrderAccess } from './order-public.service'

type OrderDraft = {
  body: CreateOrderInput
  customerWhatsapp: string | null
  paymentMethodSnapshot: unknown
  customerId: string | null
}

async function buildOrderDraft(
  body: CreateOrderInput,
  options: {
    verifyPrices: boolean
  }
): Promise<OrderDraft> {
  let customerWhatsapp: string | null = null

  try {
    customerWhatsapp = normalizeWhatsapp({
      whatsapp_prefix: body.whatsapp_prefix,
      whatsapp_number: body.whatsapp_number,
      customer_whatsapp: body.customer_whatsapp,
    })
  } catch (error) {
    throw new ValidationError(error instanceof Error ? error.message : 'Invalid WhatsApp payload')
  }

  const adminClient = createSupabaseAdminClient()

  if (options.verifyPrices) {
    try {
      await verifyItemPrices(adminClient, body.items)
    } catch (error) {
      throw new ValidationError(error instanceof Error ? error.message : 'Price verification failed')
    }
  }

  let paymentMethodSnapshot: unknown = null
  if (body.payment_method_id) {
    try {
      paymentMethodSnapshot = await getPaymentMethodSnapshot(adminClient, body.payment_method_id)
    } catch (error) {
      throw new ValidationError(error instanceof Error ? error.message : 'Payment method not found')
    }
  }

  const customerId = await upsertCustomer(adminClient, {
    customer_whatsapp: customerWhatsapp,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    country: body.country,
    province: body.province,
    city: body.city,
    birthdate: body.birthdate,
  })

  return {
    body,
    customerWhatsapp,
    paymentMethodSnapshot,
    customerId,
  }
}

export async function createPublicOrder(request: Request) {
  const ip = getClientIp(request)
  if (!orderLimiter.check(ip)) {
    throw new TooManyRequestsError('Too many requests. Please try again later.')
  }

  const rawBody = await request.json()
  const body = CreateOrderSchema.parse(rawBody)
  const draft = await buildOrderDraft(body, { verifyPrices: true })
  const adminClient = createSupabaseAdminClient()

  const { orderId, orderNumber } = await createOrder(adminClient, {
    customerId: draft.customerId,
    customerName: draft.body.customer_name,
    customerEmail: draft.body.customer_email,
    customerWhatsapp: draft.customerWhatsapp,
    paymentMethodId: draft.body.payment_method_id,
    paymentMethodSnapshot: draft.paymentMethodSnapshot,
    items: draft.body.items,
    currency: draft.body.currency,
  })

  if (!orderId || !orderNumber) {
    throw new ConflictError('Could not create order')
  }

  const { accessToken, successPath } = createPublicOrderAccess(orderId)

  void recordAnalyticsEvent(adminClient, {
    session_id: draft.body.session_id,
    event_name: 'order_created',
    order_id: orderId,
    metadata: { items: draft.body.items },
  })

  return {
    orderNumber,
    successToken: accessToken,
    successPath,
  }
}

export async function createAdminOrder(request: Request) {
  const rawBody = await request.json()
  const body = CreateOrderSchema.parse(rawBody)
  const draft = await buildOrderDraft(body, { verifyPrices: false })
  const adminClient = createSupabaseAdminClient()

  const { orderNumber } = await createOrder(adminClient, {
    customerId: draft.customerId,
    customerName: draft.body.customer_name,
    customerEmail: draft.body.customer_email,
    customerWhatsapp: draft.customerWhatsapp,
    paymentMethodId: draft.body.payment_method_id,
    paymentMethodSnapshot: draft.paymentMethodSnapshot,
    items: draft.body.items,
    currency: draft.body.currency,
  })

  return { orderNumber }
}
