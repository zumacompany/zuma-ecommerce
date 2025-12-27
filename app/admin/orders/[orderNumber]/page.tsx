import Link from 'next/link'
import { supabaseAdmin } from '../../../../lib/supabase/server'

type Props = { params: { orderNumber: string } }

export default async function AdminOrderDetails({ params }: Props) {
  const { orderNumber } = params

  const { data: order, error: orderErr } = await supabaseAdmin.from('orders').select('id, order_number, customer_name, customer_email, customer_whatsapp, status, payment_method_snapshot, total_amount, currency, created_at, customer:customers(id,name,email,whatsapp)').eq('order_number', orderNumber).maybeSingle()

  if (orderErr) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Error</h3>
        <p className="mt-2 text-sm text-muted">{orderErr.message}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">No data</h3>
        <p className="mt-2 text-sm text-muted">Order not found.</p>
        <div className="mt-4"><Link href="/admin/orders">Back to orders</Link></div>
      </div>
    )
  }

  const { data: history, error: histErr } = await supabaseAdmin.from('order_status_history').select('id, from_status, to_status, note, created_at, changed_by').eq('order_id', order.id).order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h2 className="text-xl font-semibold">Order {order.order_number}</h2>
        <div className="mt-2 text-sm text-muted">Status: <strong>{order.status}</strong></div>
        <div className="mt-2 text-sm">Customer: {order.customer && order.customer.length > 0 ? (
          <>
            <a className="text-zuma-500" href={`/admin/customers/${order.customer[0].id}`}>{order.customer[0].name}</a> · {order.customer[0].email} · {order.customer[0].whatsapp}
          </>
        ) : (
          <>{order.customer_name} · {order.customer_whatsapp} · {order.customer_email}</>
        )}</div>
        <div className="mt-2 text-sm">Total: {order.total_amount} {order.currency}</div>
        <div className="mt-2 text-sm">Payment snapshot: {order.payment_method_snapshot?.name ?? 'N/A'}</div>
      </div>

      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Status history</h3>

        {histErr ? (
          <div className="mt-3 text-sm text-danger-500">{histErr.message}</div>
        ) : (!history || history.length === 0) ? (
          <div className="mt-3 text-sm text-muted">No history found for this order.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {history.map((h: any) => (
              <div key={h.id} className="border border-borderc rounded-lg p-3">
                <div className="text-sm font-medium">{h.from_status} → {h.to_status}</div>
                <div className="text-sm text-muted">{h.note ?? ''}</div>
                <div className="text-xs text-muted mt-1">{new Date(h.created_at).toLocaleString()} {h.changed_by ? ` — by ${h.changed_by}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Link href="/admin/orders" className="text-sm text-muted">Back to orders</Link>
      </div>
    </div>
  )
}
