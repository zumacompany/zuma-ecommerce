import Link from 'next/link'
import { supabaseAdmin } from '../../../lib/supabase/server'
import EmptyState from '../../../components/admin/EmptyState'

export default async function AdminCustomersPage() {
  const { data: customers, error: custErr } = await supabaseAdmin.from('customers').select('id, name, email, whatsapp, created_at').order('created_at', { ascending: false }).limit(200)
  if (custErr) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Error</h3>
        <p className="mt-2 text-sm text-muted">{custErr.message}</p>
      </div>
    )
  }

  // fetch aggregates
  const { data: aggs } = await supabaseAdmin.from('customer_aggregates').select('customer_id, orders_count, last_order_at, delivered_total')
  const aggMap = new Map<string, any>((aggs ?? []).map((a: any) => [a.customer_id, a]))

  return (
    <div>
      <h1 className="text-2xl font-semibold">Customers</h1>
      <p className="mt-2 text-sm text-muted">Customer list and simple metrics</p>

      <div className="mt-6 rounded-xl bg-card p-4 border border-borderc">
        {(!customers || customers.length === 0) ? (
          <div className="text-sm text-muted">
            <EmptyState title="No customers" description="No customers yet." ctaLabel="Refresh" onClick={() => window.location.reload()} />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">LTV (delivered)</th>
                <th className="px-4 py-3 font-semibold">Signed up</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {(customers ?? []).map((c: any) => {
                const a = aggMap.get(c.id) ?? { orders_count: 0, last_order_at: null, delivered_total: 0 }
                return (
                  <tr key={c.id} className="border-t border-borderc">
                    <td className="px-4 py-3"><Link href={`/admin/customers/${c.id}`} className="text-zuma-500">{c.name}</Link></td>
                    <td className="px-4 py-3 text-sm text-muted">{c.email}<br/>{c.whatsapp}</td>
                    <td className="px-4 py-3">{a.orders_count ?? 0}</td>
                    <td className="px-4 py-3">{a.delivered_total ?? 0}</td>
                    <td className="px-4 py-3">{new Date(c.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3"><Link href={`/admin/customers/${c.id}`} className="text-sm text-zuma-500">View</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
