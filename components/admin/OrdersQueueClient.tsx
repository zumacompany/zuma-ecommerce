"use client"
import { useState, useEffect } from 'react'
import StatusBadge from "./StatusBadge"

export default function OrdersQueueClient({ initial }: { initial: any[] }) {
  const [orders, setOrders] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Realtime subscription to keep the queue updated

  useEffect(() => {
    let channel: any = null
    import('../../lib/supabase/browser').then(({ supabase }) => {
      if (!supabase || typeof (supabase as any).channel !== 'function') return
      channel = (supabase as any)
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
          try {
            const evt = payload.eventType
            const newRow = payload.new
            const oldRow = payload.old
            if (evt === 'INSERT') {
              setOrders((o) => [newRow, ...(o ?? [])])
            } else if (evt === 'UPDATE') {
              setOrders((o) => {
                if (!o) return o
                const idx = o.findIndex((x) => x.id === newRow.id)
                if (newRow.status === 'pending') {
                  if (idx === -1) return [newRow, ...o]
                  return o.map((x) => x.id === newRow.id ? newRow : x)
                } else {
                  // remove from queue if status no longer pending
                  return o.filter((x) => x.id !== newRow.id)
                }
              })
            } else if (evt === 'DELETE') {
              setOrders((o) => o ? o.filter((x) => x.id !== oldRow.id) : o)
            }
          } catch (e) {
            // ignore errors from unexpected payloads
          }
        })
        .subscribe()
    }).catch(() => { })

    return () => { if (channel && typeof channel.unsubscribe === 'function') channel.unsubscribe() }
  }, [])


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
                <a href={`https://wa.me/${o.customer_whatsapp.replace(/[^\d+]/g, '')}`} target="_blank" rel="noreferrer" className="text-zuma-500">Open WhatsApp</a>
              ) : <span className="text-sm text-muted">No phone</span>}</td>
              <td className="px-4 py-3">{o.total_amount} {o.currency}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
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
