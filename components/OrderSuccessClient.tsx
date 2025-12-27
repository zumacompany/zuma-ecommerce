"use client";
import { useState } from "react";

function sanitizePhone(n: string) {
  // remove non-digit characters
  return n.replace(/[^0-9]/g, '')
}

export default function OrderSuccessClient({ orderIdOrNumber, whatsappNumber, order, items }: { orderIdOrNumber: string, whatsappNumber: string, order: any, items: any[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onHandoff() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderIdOrNumber)}/handoff`, { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)

      // construct message
      let msg = `Order ${order.order_number}%0A`;
      msg += `Total: ${order.total_amount} ${order.currency}%0A`;
      msg += `Customer: ${order.customer_name} - ${order.customer_whatsapp}%0A%0A`;
      msg += `Items:%0A`;
      for (const it of items) {
        const brand = it?.offer?.brand?.name ?? ''
        const region = it?.offer?.region_code ?? ''
        const denom = `${it?.offer?.denomination_currency ?? ''} ${it?.offer?.denomination_value ?? ''}`
        msg += `- ${brand} (${region}) ${denom} x${it.qty}%0A`
      }

      // sanitize whatsappNumber and open wa.me
      const phone = sanitizePhone(whatsappNumber)
      if (!phone) throw new Error('WhatsApp number invalid')
      const url = `https://wa.me/${phone}?text=${msg}`

      // analytics event is recorded server-side in handoff route, but we can also attempt client-side call (optional)
      window.open(url, '_blank')
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <button className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-green-600 text-white`} onClick={onHandoff} disabled={loading}>
        Continue on WhatsApp
      </button>
      {error && <div className="mt-2 text-sm text-danger-500">{error}</div>}
    </div>
  )
}
