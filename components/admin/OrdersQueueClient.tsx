"use client"
import { useState } from 'react'

export default function OrdersQueueClient({ initial }: { initial: any[] }) {
  const [orders, setOrders] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      // optimistic update
      setOrders((o) => o.filter(x => x.id !== id))
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    } finally {
      setLoading(false)
    }
  }

  if (!orders || orders.length === 0) return (
    <div className="rounded-xl bg-card p-6 border border-borderc">
      <div className="text-sm text-muted">No data — no pending orders.</div>
    </div>
  )

  return (
    <div className="rounded-xl bg-card p-4 border border-borderc">
      {error && <div className="text-sm text-danger-500">{error}</div>}
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">When</th>
            <th className="px-4 py-3 font-semibold">WhatsApp</th>
            <th className="px-4 py-3 font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o: any) => (
            <tr key={o.id} className="border-t border-borderc">
              <td className="px-4 py-3">{o.order_number}</td>
              <td className="px-4 py-3">{new Date(o.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">{o.customer_whatsapp ? (
                <a href={`https://wa.me/${o.customer_whatsapp.replace(/[^\d+]/g,'')}`} target="_blank" rel="noreferrer" className="text-zuma-500">Open WhatsApp</a>
              ) : <span className="text-sm text-muted">No phone</span>}</td>
              <td className="px-4 py-3">{o.total_amount} {o.currency}</td>
              <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-zuma-50 text-sm">{o.status}</span></td>
              <td className="px-4 py-3 flex gap-2">
                <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => updateStatus(o.id, 'delivered')} disabled={loading}>Mark delivered</button>
                <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => updateStatus(o.id, 'cancelled')} disabled={loading}>Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
