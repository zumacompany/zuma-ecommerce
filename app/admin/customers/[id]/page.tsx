import Link from 'next/link'
import { supabaseAdmin } from '../../../../lib/supabase/server'

type Props = { params: { id: string } }

export default async function AdminCustomerDetails({ params }: Props) {
  const id = params.id
  const { data: cust, error: custErr } = await supabaseAdmin.from('customers').select('id, name, email, whatsapp, country, province, created_at').eq('id', id).maybeSingle()
  if (custErr) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Error</h3>
        <p className="mt-2 text-sm text-muted">{custErr.message}</p>
      </div>
    )
  }
  if (!cust) return (
    <div className="rounded-xl bg-card p-6 border border-borderc">
      <h3 className="text-lg font-semibold">No data</h3>
      <p className="mt-2 text-sm text-muted">Customer not found.</p>
      <div className="mt-4"><Link href="/admin/customers">Back to customers</Link></div>
    </div>
  )

  const { data: aggs } = await supabaseAdmin.from('customer_aggregates').select('orders_count, last_order_at, delivered_total').eq('customer_id', id).maybeSingle()
  const { data: orders } = await supabaseAdmin.from('orders').select('id, order_number, status, total_amount, currency, created_at').eq('customer_id', id).order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h2 className="text-xl font-semibold">{cust.name}</h2>
        <div className="mt-2 text-sm text-muted">{cust.email} · {cust.whatsapp}</div>
        <div className="mt-2 text-sm">Country: {cust.country ?? '—'} · Province: {cust.province ?? '—'}</div>
        <div className="mt-2 text-sm">Signed up: {new Date(cust.created_at).toLocaleString()}</div>
        <div className="mt-3 text-sm">Orders: {aggs?.orders_count ?? 0} · Last: {aggs?.last_order_at ? new Date(aggs.last_order_at).toLocaleString() : '—'} · LTV: {aggs?.delivered_total ?? 0}</div>
      </div>

      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Orders</h3>
        {(!orders || orders.length === 0) ? (
          <div className="mt-3 text-sm text-muted">No orders for this customer.</div>
        ) : (
          <table className="w-full text-left text-sm mt-3">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((o: any) => (
                <tr key={o.id} className="border-t border-borderc">
                  <td className="px-4 py-3">{o.order_number}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{o.total_amount} {o.currency}</td>
                  <td className="px-4 py-3">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3"><Link href={`/admin/orders/${o.order_number}`} className="text-sm text-zuma-500">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <Link href="/admin/customers" className="text-sm text-muted">Back to customers</Link>
      </div>
    </div>
  )
}
