import Link from "next/link"
import { ArrowLeft, Mail, Smartphone, MapPin, Calendar, ShoppingBag, DollarSign, User, ExternalLink } from "lucide-react"
import { supabaseAdmin } from "../../../../lib/supabase/server"
import EmptyState from "../../../../components/admin/EmptyState"
import {
  formatOrderStatusText,
  getOrderStatusBadgeClass,
} from "@/src/server/modules/orders/order-status.mapper"

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

function customerStatusClasses(status: string) {
  return status === "active"
    ? "bg-success-50 text-success-700"
    : "bg-danger-50 text-danger-700"
}

export default async function AdminCustomerDetails({ params }: Props) {
  const id = params.id

  const { data: cust, error: custErr } = await supabaseAdmin
    .from("customers")
    .select("id, name, email, whatsapp_e164, country, province, created_at, orders_count, delivered_total, status")
    .eq("id", id)
    .maybeSingle()

  if (custErr) {
    return (
      <div className="rounded-2xl border border-borderc bg-card p-8 shadow-card flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-full bg-danger-50 text-danger-500 flex items-center justify-center mb-4">
          <ArrowLeft className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold">Erro ao carregar cliente</h3>
        <p className="mt-2 text-sm text-muted">{custErr.message}</p>
        <Link href="/admin/customers" className="mt-6 text-zuma-500 font-medium hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para Clientes
        </Link>
      </div>
    )
  }

  if (!cust)
    return (
      <div className="rounded-2xl border border-borderc bg-card p-8 shadow-card flex flex-col items-center text-center">
        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Cliente Não Encontrado</h3>
        <p className="mt-2 text-sm text-muted">O cliente que você está procurando não existe ou foi removido.</p>
        <Link href="/admin/customers" className="mt-6 px-4 py-2 bg-zuma-500 text-white rounded-xl text-sm font-semibold hover:bg-zuma-600 transition-colors">
          Voltar para Clientes
        </Link>
      </div>
    )

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, total_amount, currency, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })

  const initials = cust.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
        <Link href="/admin" className="transition hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/customers" className="transition hover:text-foreground">
          Clientes
        </Link>
        <span>/</span>
        <span className="text-foreground">{cust.name}</span>
      </div>

      <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-zuma-500/10 text-zuma-600 flex items-center justify-center text-lg font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Cliente</p>
              <h1 className="text-2xl font-semibold text-foreground">{cust.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {cust.email}
                </span>
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  {cust.whatsapp_e164}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {cust.province}, {cust.country}
                </span>
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${customerStatusClasses(cust.status)}`}>
            {cust.status === "active" ? "ATIVO" : "INATIVO"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <StatCard icon={<ShoppingBag className="w-4 h-4" />} label="Total de Pedidos" value={cust.orders_count} />
          <StatCard icon={<DollarSign className="w-4 h-4" />} label="Valor Total Gasto" value={`${cust.delivered_total.toLocaleString()} MT`} highlight />
          <StatCard icon={<Calendar className="w-4 h-4" />} label="Cliente Desde" value={new Date(cust.created_at).toLocaleDateString("pt-MZ")} />
          <StatCard icon={<User className="w-4 h-4" />} label="ID do Cliente" value={cust.id.substring(0, 8).toUpperCase()} />
        </div>
      </div>

      <div className="rounded-2xl border border-borderc bg-card shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-borderc">
          <h2 className="text-lg font-semibold text-foreground">Histórico de Pedidos</h2>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="Nenhum pedido ainda"
              description="Este cliente ainda não fez nenhum pedido na plataforma."
              icon={<ShoppingBag className="w-12 h-12 text-muted/30" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Pedido #</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Valor</th>
                  <th className="px-6 py-3 text-left font-semibold">Data</th>
                  <th className="px-6 py-3 text-right font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderc">
                {orders.map((o: any) => (
                  <tr key={o.id} className="transition hover:bg-muted/5">
                    <td className="px-6 py-4 font-semibold text-foreground">{o.order_number}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getOrderStatusBadgeClass(o.status)}`}>
                        {formatOrderStatusText(o.status).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {o.total_amount.toLocaleString()} {o.currency}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {new Date(o.created_at).toLocaleString("pt-MZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${o.order_number}`}
                        className="inline-flex items-center gap-1.5 text-zuma-600 font-medium hover:text-zuma-700 transition-colors"
                      >
                        Ver Detalhes <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl border border-borderc bg-muted/5 p-4">
      <div className="flex items-center gap-2 text-muted">
        <span className={highlight ? "text-zuma-600" : ""}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className={`mt-2 text-lg font-semibold ${highlight ? "text-zuma-600" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  )
}
