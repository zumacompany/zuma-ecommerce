import Link from 'next/link'
import EmptyState from '../../../components/admin/EmptyState'
import { supabaseAdmin } from '../../../lib/supabase/server'

export default async function AdminOrdersPage() {
  const { data: orders, error } = await supabaseAdmin.from('orders').select('id, order_number, customer_name, status, total_amount, currency, created_at, customer:customers(id, name, email, whatsapp)').order('created_at', { ascending: false }).limit(50)

  if (error) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Error</h3>
        <p className="mt-2 text-sm text-muted">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="mt-2 text-sm text-muted">Recent orders (latest 50)</p>

      <div className="mt-6 rounded-xl bg-card p-4 border border-borderc">
        {(!orders || orders.length === 0) ? (
          <div className="text-sm text-muted">
            <EmptyState title="No orders" description="No orders yet." ctaLabel="Reload" onClick={() => window.location.reload()} />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="border-t border-borderc">
                  <td className="px-4 py-3">{o.order_number}</td>
                  <td className="px-4 py-3">{o.customer ? (<>
                    <a className="text-sm text-zuma-500" href={`/admin/customers/${o.customer.id}`}>{o.customer.name}</a>
                    <div className="text-xs text-muted">{o.customer.email ?? ''} · {o.customer.whatsapp ?? ''}</div>
                  </>) : (o.customer_name)}</td>
                  <td className="px-4 py-3">{o.total_amount} {o.currency}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3"><Link href={`/admin/orders/${o.order_number}`} className="text-sm text-zuma-500">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
