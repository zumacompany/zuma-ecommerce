import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Smartphone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  User,
  ExternalLink
} from 'lucide-react'
import { supabaseAdmin } from '../../../../lib/supabase/server'
import EmptyState from '../../../../components/admin/EmptyState'

type Props = { params: { id: string } }

export default async function AdminCustomerDetails({ params }: Props) {
  const id = params.id

  // Fetch customer details with fixed column name
  const { data: cust, error: custErr } = await supabaseAdmin
    .from('customers')
    .select('id, name, email, whatsapp_e164, country, province, created_at, orders_count, delivered_total, status')
    .eq('id', id)
    .maybeSingle()

  if (custErr) {
    return (
      <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm flex flex-col items-center text-center">
        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <ArrowLeft className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold">Erro ao carregar cliente</h3>
        <p className="mt-2 text-sm text-muted">{custErr.message}</p>
        <Link href="/admin/customers" className="mt-6 text-zuma-500 font-medium hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para Clientes
        </Link>
      </div>
    )
  }

  if (!cust) return (
    <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm flex flex-col items-center text-center">
      <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
        <User className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-foreground">Cliente Não Encontrado</h3>
      <p className="mt-2 text-sm text-muted">O cliente que você está procurando não existe ou foi removido.</p>
      <Link href="/admin/customers" className="mt-6 px-4 py-2 bg-zuma-500 text-white rounded-xl text-sm font-semibold hover:bg-zuma-600 transition-colors">
        Voltar para Clientes
      </Link>
    </div>
  )

  // Fetch orders for this customer
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, status, total_amount, currency, created_at')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  const initials = cust.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Clientes
      </Link>

      {/* Header Section */}
      <div className="bg-card rounded-2xl border border-borderc p-8 shadow-sm">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
            {initials}
          </div>

          {/* Customer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-foreground">{cust.name}</h1>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${cust.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {cust.status === 'active' ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
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

        {/* Stats Grid */}
        <div className="mt-8 pt-8 border-t border-borderc">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              icon={<ShoppingBag className="w-5 h-5" />}
              label="Total de Pedidos"
              value={cust.orders_count}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Valor Total Gasto"
              value={`${cust.delivered_total.toLocaleString()} MT`}
              highlight
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Cliente Desde"
              value={new Date(cust.created_at).toLocaleDateString('pt-MZ')}
            />
            <StatCard
              icon={<User className="w-5 h-5" />}
              label="ID do Cliente"
              value={cust.id.substring(0, 8).toUpperCase()}
            />
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-card rounded-2xl border border-borderc shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-muted/30">
          <h2 className="text-lg font-bold text-foreground">Histórico de Pedidos</h2>
        </div>

        {(!orders || orders.length === 0) ? (
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
              <thead className="bg-muted/20 text-muted border-b border-borderc">
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
                  <tr key={o.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{o.order_number}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase ${o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        o.status === 'canceled' ? 'bg-red-100 text-red-700' :
                          o.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                            o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              o.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                        }`}>
                        {o.status === 'delivered' ? 'ENTREGUE' :
                          o.status === 'canceled' ? 'CANCELADO' :
                            o.status === 'on_hold' ? 'EM ESPERA' :
                              o.status === 'shipped' ? 'ENVIADO' :
                                o.status === 'processing' ? 'PROCESSANDO' :
                                  'NOVO'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{o.total_amount.toLocaleString()} {o.currency}</td>
                    <td className="px-6 py-4 text-muted">{new Date(o.created_at).toLocaleString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${o.order_number}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-700 transition-colors"
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

function StatCard({ icon, label, value, highlight = false }: {
  icon: React.ReactNode
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted">
        <span className={highlight ? "text-blue-600" : ""}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-xl font-bold ${highlight ? "text-blue-600" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  )
}
