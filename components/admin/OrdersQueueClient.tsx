"use client"
import { useState, useEffect } from "react"
import StatusBadge from "./StatusBadge"
import { useI18n } from "../../lib/i18n"
import type { OrderStatus } from "@/src/server/modules/orders/order-status"
import { isQueuedOrderStatus } from "@/src/server/modules/orders/order-status.mapper"

export default function OrdersQueueClient({ initial }: { initial: any[] }) {
  const [orders, setOrders] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t, locale } = useI18n()

  useEffect(() => {
    let channel: any = null
    import("../../lib/supabase/browser")
      .then(({ supabase }) => {
        if (!supabase || typeof (supabase as any).channel !== "function") return
        channel = (supabase as any)
          .channel("public:orders")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "orders" },
            (payload: any) => {
              try {
                const evt = payload.eventType
                const newRow = payload.new
                const oldRow = payload.old
                if (evt === "INSERT") {
                  if (isQueuedOrderStatus(newRow?.status)) {
                    setOrders((o) => [newRow, ...(o ?? [])])
                  }
                } else if (evt === "UPDATE") {
                  setOrders((o) => {
                    if (!o) return o
                    const idx = o.findIndex((x) => x.id === newRow.id)
                    if (isQueuedOrderStatus(newRow?.status)) {
                      if (idx === -1) return [newRow, ...o]
                      return o.map((x) => (x.id === newRow.id ? newRow : x))
                    }
                    return o.filter((x) => x.id !== newRow.id)
                  })
                } else if (evt === "DELETE") {
                  setOrders((o) => (o ? o.filter((x) => x.id !== oldRow.id) : o))
                }
              } catch (e) {
                // ignore errors from unexpected payloads
              }
            }
          )
          .subscribe()
      })
      .catch(() => {})

    return () => {
      if (channel && typeof channel.unsubscribe === "function") channel.unsubscribe()
    }
  }, [])

  async function updateStatus(id: string, status: OrderStatus) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setOrders((o) => o.filter((x) => x.id !== id))
    } catch (err: any) {
      setError(err?.message ?? "unknown")
    } finally {
      setLoading(false)
    }
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
        <div className="text-sm text-muted">{t("orders.queue.noData")}</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-borderc bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-borderc px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("orders.queue.title")}</h3>
        </div>
        {error && <span className="text-xs font-semibold text-danger-500">{error}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("orders.queue.order")}</th>
              <th className="px-4 py-3 font-semibold">{t("orders.queue.when")}</th>
              <th className="px-4 py-3 font-semibold">{t("orders.queue.whatsapp")}</th>
              <th className="px-4 py-3 font-semibold">{t("orders.queue.total")}</th>
              <th className="px-4 py-3 font-semibold">{t("orders.queue.status")}</th>
              <th className="px-4 py-3 font-semibold">{t("orders.queue.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderc">
            {orders.map((o: any) => (
              <tr key={o.id} className="transition hover:bg-muted/5">
                <td className="px-4 py-3 font-semibold">{o.order_number}</td>
                <td className="px-4 py-3 text-muted">
                  {new Date(o.created_at).toLocaleString(locale === "pt" ? "pt-MZ" : "en-US")}
                </td>
                <td className="px-4 py-3">
                  {o.customer_whatsapp ? (
                    <a
                      href={`https://wa.me/${o.customer_whatsapp.replace(/[^\d+]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zuma-500 hover:text-zuma-600"
                    >
                      {t("orders.queue.openWhatsapp")}
                    </a>
                  ) : (
                    <span className="text-sm text-muted">{t("orders.queue.noPhone")}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {o.total_amount} {o.currency}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-lg bg-success-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-success-700 disabled:opacity-50"
                      onClick={() => updateStatus(o.id, "delivered")}
                      disabled={loading}
                    >
                      {t("orders.queue.markDelivered")}
                    </button>
                    <button
                      className="rounded-lg bg-danger-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-danger-700 disabled:opacity-50"
                      onClick={() => updateStatus(o.id, "canceled")}
                      disabled={loading}
                    >
                      {t("orders.queue.cancel")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
