import Link from 'next/link'
import { supabaseAdmin } from '../../../../lib/supabase/server'
import OrderSuccessClient from '../../../../components/OrderSuccessClient'

type Props = { params: { orderNumber: string } }

export default async function OrderSuccessPage({ params }: Props) {
  const { orderNumber } = params

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, total_amount, currency, payment_method_snapshot, customer_name, customer_whatsapp, created_at')
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (orderErr) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="mt-2 text-sm text-muted">{orderErr.message}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-2xl font-semibold">No data</h2>
            <p className="mt-2 text-sm text-muted">Order not found.</p>
            <div className="mt-4">
              <Link href="/">Go back to home</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // fetch items joined with offers + brand
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .select('id, qty, unit_price, offer:offers(id, denomination_currency, denomination_value, region_code, brand:brands(id, name, slug))')
    .eq('order_id', order.id)

  // fetch site whatsapp config (key = 'site')
  const { data: siteRow } = await supabaseAdmin.from('site_content').select('value').eq('key', 'site').maybeSingle()
  const whatsappNumber = siteRow?.value?.whatsapp_number ?? null

  return (
    <main className="py-8">
      <div className="container max-w-[1200px]">
        <h1 className="text-2xl font-semibold">Order created ✅</h1>
        <p className="mt-2 text-sm text-muted">Continue on WhatsApp to finish the service.</p>

        <div className="mt-6 rounded-xl bg-card p-6 border border-borderc">
          <h3 className="text-lg font-semibold">Order summary</h3>

          <div className="mt-4 text-sm">
            <div><strong>Order:</strong> {order.order_number}</div>
            <div className="mt-2"><strong>Total:</strong> {order.total_amount} {order.currency}</div>
            <div className="mt-2"><strong>Payment:</strong> {order.payment_method_snapshot?.name ?? 'N/A'}</div>
            <div className="mt-2"><strong>Customer:</strong> {order.customer_name} — {order.customer_whatsapp}</div>

            <div className="mt-4">
              <strong>Items</strong>
              {itemsErr ? (
                <div className="mt-2 text-sm text-danger-500">Error loading items</div>
              ) : !items || items.length === 0 ? (
                <div className="mt-2 text-sm text-muted">No data</div>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {items.map((it: any) => (
                    <li key={it.id}>
                      {it.offer?.brand?.name ?? '—'} — {it.offer?.region_code ?? '—'} — {it.offer?.denomination_currency} {it.offer?.denomination_value} x{it.qty}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              {whatsappNumber ? (
                <OrderSuccessClient orderIdOrNumber={order.order_number} whatsappNumber={whatsappNumber} order={order} items={items ?? []} />
              ) : (
                <div className="rounded-md p-3 bg-card border border-borderc text-sm text-muted">No data — WhatsApp number not configured.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
