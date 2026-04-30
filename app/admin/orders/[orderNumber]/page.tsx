import Link from "next/link"
import { supabaseAdmin } from "../../../../lib/supabase/server"
import OrderDelivery from "../../../../components/admin/OrderDelivery"
import {
  formatOrderStatusText,
  getOrderStatusBadgeClass,
} from "@/src/server/modules/orders/order-status.mapper"

export const dynamic = "force-dynamic"

type Props = { params: { orderNumber: string } }

function formatStatus(status?: string | null) {
  return formatOrderStatusText(status)
}

export default async function AdminOrderDetails({ params }: Props) {
  const { orderNumber } = params

  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_email, customer_whatsapp, status, payment_method_snapshot, total_amount, currency, created_at, delivery_codes, admin_notes, customer:customers(id,name,email,whatsapp_e164)"
    )
    .eq("order_number", orderNumber)
    .maybeSingle()

  if (orderErr) {
    return (
      <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
        <h3 className="text-lg font-semibold">Error</h3>
        <p className="mt-2 text-sm text-muted">{orderErr.message}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
        <h3 className="text-lg font-semibold">No data</h3>
        <p className="mt-2 text-sm text-muted">Order not found.</p>
        <div className="mt-4">
          <Link href="/admin/orders" className="text-sm text-zuma-500">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const { data: history, error: histErr } = await supabaseAdmin
    .from("order_status_history")
    .select("id, from_status, to_status, note, created_at, changed_by")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })

  const customer = Array.isArray(order.customer) ? order.customer[0] ?? null : order.customer
  const customerName = customer?.name || order.customer_name
  const customerEmail = customer?.email || order.customer_email
  const customerWhatsapp = customer?.whatsapp_e164 || order.customer_whatsapp

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
        <Link href="/admin" className="transition hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/orders" className="transition hover:text-foreground">
          Orders
        </Link>
        <span>/</span>
        <span className="text-foreground">#{order.order_number}</span>
      </div>

      <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Order
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              #{order.order_number}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Created {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getOrderStatusBadgeClass(
              order.status
            )}`}
          >
            {formatStatus(order.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-borderc bg-muted/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Total</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {order.total_amount} {order.currency}
            </p>
          </div>
          <div className="rounded-xl border border-borderc bg-muted/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Payment
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {order.payment_method_snapshot?.name ?? "N/A"}
            </p>
          </div>
          <div className="rounded-xl border border-borderc bg-muted/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Customer</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {customerName || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Customer</p>
                <h2 className="text-lg font-semibold text-foreground">Contact details</h2>
              </div>
              {customer?.id && (
                <Link href={`/admin/customers/${customer.id}`} className="text-sm text-zuma-500">
                  View customer
                </Link>
              )}
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Name</p>
                <p className="mt-1 font-medium text-foreground">{customerName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Email</p>
                <p className="mt-1 text-muted">{customerEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">WhatsApp</p>
                <p className="mt-1 text-muted">{customerWhatsapp || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
            <h3 className="text-lg font-semibold text-foreground">Status history</h3>
            {histErr ? (
              <div className="mt-3 text-sm text-danger-500">{histErr.message}</div>
            ) : !history || history.length === 0 ? (
              <div className="mt-3 text-sm text-muted">No history found for this order.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {history.map((h: any) => (
                  <div key={h.id} className="rounded-xl border border-borderc p-4">
                    <div className="text-sm font-semibold">
                      {formatStatus(h.from_status)} → {formatStatus(h.to_status)}
                    </div>
                    {h.note && <div className="mt-1 text-sm text-muted">{h.note}</div>}
                    <div className="mt-2 text-xs text-muted">
                      {new Date(h.created_at).toLocaleString()} {h.changed_by ? `— ${h.changed_by}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <OrderDelivery
            orderId={order.id}
            initialCodes={order.delivery_codes}
            initialNotes={order.admin_notes}
            customerName={customerName}
            customerWhatsapp={customerWhatsapp}
            customerEmail={customerEmail}
          />
        </div>
      </div>
    </div>
  )
}
