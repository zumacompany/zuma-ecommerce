import 'server-only'
import { recordAnalyticsEvent } from '@/lib/services/orders'
import { getPublicWhatsappNumber } from '@/src/server/modules/content/public-site-content.service'
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'
import {
  buildPublicOrderSuccessPath,
  createPublicOrderAccessToken,
  verifyPublicOrderAccessToken,
} from './order-access.policy'
import {
  isTerminalOrderStatus,
  normalizeOrderStatus,
} from './order-status.mapper'

type PublicOrderSummary = {
  id: string
  order_number: string
  total_amount: number
  currency: string
  payment_method_snapshot: { name?: string | null } | null
  customer_name: string | null
  customer_whatsapp: string | null
  created_at: string
  status: string | null
  handoff_clicked_at: string | null
}

async function getPublicOrderSummaryByToken(accessToken: string): Promise<PublicOrderSummary> {
  const { orderId } = verifyPublicOrderAccessToken(accessToken)
  const adminClient = createSupabaseAdminClient()

  const { data, error } = await adminClient
    .from('orders')
    .select('id, order_number, total_amount, currency, payment_method_snapshot, customer_name, customer_whatsapp, created_at, status, handoff_clicked_at')
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  if (!data) {
    throw new NotFoundError('Order')
  }

  return data as PublicOrderSummary
}

export function createPublicOrderAccess(orderId: string) {
  const accessToken = createPublicOrderAccessToken({ orderId })

  return {
    accessToken,
    successPath: buildPublicOrderSuccessPath(accessToken),
  }
}

export async function getPublicOrderSuccessData(accessToken: string) {
  const adminClient = createSupabaseAdminClient()
  const order = await getPublicOrderSummaryByToken(accessToken)

  const [itemsResult, whatsappNumber] = await Promise.all([
    adminClient
      .from('order_items')
      .select('id, qty, unit_price, offer:offers(id, denomination_currency, denomination_value, region_code, brand:brands(id, name, slug))')
      .eq('order_id', order.id),
    getPublicWhatsappNumber(),
  ])

  if (itemsResult.error) {
    throw new ValidationError(itemsResult.error.message)
  }

  return {
    accessToken,
    order,
    items: itemsResult.data ?? [],
    whatsappNumber,
  }
}

export async function markPublicOrderHandoff(accessToken: string) {
  const adminClient = createSupabaseAdminClient()
  const order = await getPublicOrderSummaryByToken(accessToken)
  const previousStatus = normalizeOrderStatus(order.status) ?? 'new'
  const shouldTransitionToOnHold =
    !isTerminalOrderStatus(previousStatus) && previousStatus !== 'on_hold'

  if (shouldTransitionToOnHold) {
    const { data: updatedOrder, error: updateError } = await adminClient
      .from('orders')
      .update({ status: 'on_hold', handoff_clicked_at: new Date().toISOString() })
      .eq('id', order.id)
      .select('id')
      .limit(1)

    if (updateError) {
      throw new ValidationError(updateError.message)
    }

    const updatedId =
      Array.isArray(updatedOrder) && updatedOrder.length > 0 ? updatedOrder[0].id : null

    if (!updatedId) {
      throw new ConflictError('Could not update order')
    }

    await adminClient.from('order_status_history').insert([
      {
        order_id: updatedId,
        changed_by: null,
        from_status: previousStatus,
        to_status: 'on_hold',
        note: 'Customer WhatsApp handoff',
      },
    ])
  }

  await recordAnalyticsEvent(adminClient, {
    session_id: null,
    event_name: 'whatsapp_clicked',
    order_id: order.id,
  })

  return { ok: true }
}
