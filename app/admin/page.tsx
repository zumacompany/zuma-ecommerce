import TimeRangePicker from '../../components/admin/TimeRangePicker'
import OrdersQueueClient from '../../components/admin/OrdersQueueClient'
import { supabaseAdmin } from '../../lib/supabase/server'

type Props = { searchParams?: { [key: string]: string | undefined } }

export default async function AdminDashboard({ searchParams }: Props) {
  const preset = searchParams?.preset ?? '7d'
  let start: Date | null = null
  let end: Date | null = null
  const now = new Date()

  if (preset === '24h') {
    start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    end = now
  } else if (preset === '7d') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    end = now
  } else if (preset === '30d') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    end = now
  } else if (preset === 'custom' && searchParams?.start && searchParams?.end) {
    start = new Date(searchParams.start)
    end = new Date(searchParams.end)
  } else if (preset === 'all') {
    start = null
    end = null
  }

  const rangeText = start && end ? (searchParams?.preset === 'custom' ? `Custom: ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}` : `Last ${searchParams?.preset ?? '7d'}`) : 'All time'

  // Build query for events
  let eventsQuery = supabaseAdmin.from('analytics_events').select('event_name, metadata, created_at')
  if (start && end) {
    eventsQuery = eventsQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
  }
  const { data: eventsRaw } = await eventsQuery

  const events = (eventsRaw ?? []) as Array<any>

  const counts: Record<string, number> = {}
  for (const ev of events) {
    counts[ev.event_name] = (counts[ev.event_name] ?? 0) + 1
  }

  // delivered orders & revenue
  let ordersQuery = supabaseAdmin.from('orders').select('id, total_amount, currency, status, created_at')
  if (start && end) ordersQuery = ordersQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
  const { data: deliveredOrders } = await ordersQuery.eq('status', 'delivered')
  const delivered = (deliveredOrders ?? []) as Array<any>
  const deliveredCount = delivered.length
  const estimatedRevenue = delivered.reduce((s, o) => s + (o.total_amount ?? 0), 0)

  // Customers metrics (new / returning / LTV proxy) using customer_aggregates
  // count new customers in range
  let newCustomersCount = 0
  if (start && end) {
    const { count } = await supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }).gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
    newCustomersCount = count ?? 0
  } else {
    const { count } = await supabaseAdmin.from('customers').select('id', { count: 'exact', head: true })
    newCustomersCount = count ?? 0
  }

  // aggregates (orders_count, last_order_at, delivered_total)
  const { data: allAggs } = await supabaseAdmin.from('customer_aggregates').select('customer_id, orders_count, last_order_at, delivered_total')
  const aggs = (allAggs ?? []) as Array<any>
  const returningCustomersCount = aggs.filter(a => a.orders_count > 1 && start && end ? (new Date(a.last_order_at) >= start && new Date(a.last_order_at) <= end) : a.orders_count > 1).length
  const ltvProxy = aggs.reduce((s, a) => s + (Number(a.delivered_total ?? 0)), 0)
  // Funnel steps
  const funnelSteps = ['page_view', 'view_brand', 'checkout_started', 'order_created', 'whatsapp_clicked']
  const funnelCounts = funnelSteps.map((s) => counts[s] ?? 0)

  // Popular categories / brands
  const catCounts: Record<string, number> = {}
  const brandCounts: Record<string, number> = {}
  for (const ev of events) {
    if (ev.event_name === 'view_category' && ev.metadata?.category_slug) {
      const c = ev.metadata.category_slug
      catCounts[c] = (catCounts[c] ?? 0) + 1
    }
    if (ev.event_name === 'view_brand' && ev.metadata?.brand_slug) {
      const b = ev.metadata.brand_slug
      brandCounts[b] = (brandCounts[b] ?? 0) + 1
    }
  }

  const popularCategories = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const popularBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Orders queue
  const { data: ordersQueue } = await supabaseAdmin.from('orders').select('id, order_number, customer_whatsapp, total_amount, currency, status, created_at').in('status', ['new', 'on_hold']).order('created_at', { ascending: true }).limit(100)

  const hasTraffic = events.length > 0 || deliveredCount > 0

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Olá, Admin! 👋</h1>
          <p className="text-muted mt-1">Aqui está o que está acontecendo na sua loja hoje.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm border border-borderc rounded-lg px-3 py-1.5">{rangeText}</div>
          <TimeRangePicker />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* Revenue Card (Dark/Contrast) */}
        <div className="rounded-2xl bg-card p-6 border border-borderc shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 rounded-full bg-zuma-500/10 flex items-center justify-center text-zuma-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-xs font-bold text-success-600 bg-success-500/10 px-2 py-1 rounded-full">+2.5%</div>
            </div>
            <div className="text-muted text-sm font-medium">Receita Estimada</div>
            <div className="text-3xl font-bold mt-1 text-text">
              {(estimatedRevenue ?? 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
            </div>
          </div>
          {/* Decorative Blob */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-zuma-500/5 rounded-full blur-2xl group-hover:bg-zuma-500/10 transition-all"></div>
        </div>

        {/* Orders Card */}
        <div className="rounded-2xl bg-card p-6 border border-borderc shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
          </div>
          <div className="text-muted text-sm font-medium">Pedidos Entregues</div>
          <div className="text-3xl font-bold mt-1 text-text">{deliveredCount}</div>
        </div>

        {/* New Customers */}
        <div className="rounded-2xl bg-card p-6 border border-borderc shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
          </div>
          <div className="text-muted text-sm font-medium">Novos Clientes</div>
          <div className="text-3xl font-bold mt-1 text-text">{newCustomersCount}</div>
        </div>

        {/* Visitors */}
        <div className="rounded-2xl bg-card p-6 border border-borderc shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
          <div className="text-muted text-sm font-medium">Visitas</div>
          <div className="text-3xl font-bold mt-1 text-text">{counts['page_view'] ?? 0}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Main Chart: Revenue/Visits Trend (Mocked visual for now using BarChart) */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 border border-borderc shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Resumo Financeiro</h3>
            <button className="text-xs font-semibold bg-muted/10 px-3 py-1 rounded-full hover:bg-muted/20 transition">Ver Relatório</button>
          </div>
          <div className="h-64 w-full flex items-end">
            {/* Using generic data if no detailed timeline available, or use event counts per day if possible. 
                 For MVP redesign, we use a placeholder distribution based on simple stats. 
             */}
            <div className="w-full h-full flex items-end justify-center text-muted text-sm">
              {/* Simple Bar Chart Visualization */}
              <div className="w-full h-48 flex items-end justify-between gap-2">
                <div className="w-full bg-zuma-500/20 rounded-t h-[40%] hover:h-[45%] transition-all relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold">Seg</div></div>
                <div className="w-full bg-zuma-500/30 rounded-t h-[60%] hover:h-[65%] transition-all relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold">Ter</div></div>
                <div className="w-full bg-zuma-500/50 rounded-t h-[30%] hover:h-[35%] transition-all relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold">Qua</div></div>
                <div className="w-full bg-zuma-500/40 rounded-t h-[80%] hover:h-[85%] transition-all relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold">Qui</div></div>
                <div className="w-full bg-zuma-500 rounded-t h-[50%] hover:h-[55%] transition-all relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold">Sex</div></div>
                <div className="w-full bg-zuma-500/60 rounded-t h-[70%] hover:h-[75%] transition-all relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold">Sab</div></div>
                <div className="w-full bg-zuma-500/80 rounded-t h-[90%] hover:h-[95%] transition-all relative group"><div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs font-bold">Dom</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Donut */}
        <div className="rounded-2xl bg-card p-6 border border-borderc shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-6">Vendas por Categoria</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Simple CSS Donut representation */}
            <div className="relative w-48 h-48 rounded-full border-[16px] border-zuma-500/20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[16px] border-transparent border-t-zuma-500 border-r-zuma-500 transform rotate-45"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">{popularCategories.reduce((a, b) => a + b[1], 0)}</div>
                <div className="text-xs text-muted">Vendas</div>
              </div>
            </div>

            <div className="mt-8 w-full space-y-3">
              {popularCategories.slice(0, 3).map(([slug, c], i) => (
                <div key={slug} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-zuma-500' : i === 1 ? 'bg-zuma-500/50' : 'bg-zuma-500/20'}`} />
                    <span className="capitalize">{slug}</span>
                  </div>
                  <span className="font-bold">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="rounded-2xl bg-card border border-borderc shadow-sm overflow-hidden">
        <div className="p-6 border-b border-borderc flex justify-between items-center">
          <h3 className="text-lg font-bold">Pedidos Recentes</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-zuma-500 text-white text-sm font-medium">+ Add Order</button>
          </div>
        </div>
        <div className="p-6">
          <OrdersQueueClient initial={(ordersQueue ?? [])} />
        </div>
      </div>

    </div>
  )
}
