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

  const rangeText = start && end ? (searchParams?.preset === 'custom' ? `Custom: ${start.toISOString().slice(0,10)} to ${end.toISOString().slice(0,10)}` : `Last ${searchParams?.preset ?? '7d'}`) : 'All time'

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

  const popularCategories = Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).slice(0,10)
  const popularBrands = Object.entries(brandCounts).sort((a,b)=>b[1]-a[1]).slice(0,10)

  // Orders queue
  const { data: ordersQueue } = await supabaseAdmin.from('orders').select('id, order_number, customer_whatsapp, total_amount, currency, status, created_at').in('status', ['new', 'on_hold']).order('created_at', { ascending: true }).limit(100)

  const hasTraffic = events.length > 0 || deliveredCount > 0

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-sm text-muted">Health, funnels and operational queue.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted">{rangeText}</div>
          <TimeRangePicker />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-card p-4 border border-borderc">
          <div className="text-sm text-muted">Visits</div>
          <div className="text-2xl font-semibold mt-2">{counts['page_view'] ? counts['page_view'] : (hasTraffic ? 0 : 'No data')}</div>
          {!hasTraffic && <div className="text-xs text-muted mt-1">No events/orders in this range.</div>}
        </div>

        <div className="rounded-xl bg-card p-4 border border-borderc">
          <div className="text-sm text-muted">Checkout started</div>
          <div className="text-2xl font-semibold mt-2">{counts['checkout_started'] ? counts['checkout_started'] : (hasTraffic ? 0 : 'No data')}</div>
          {!hasTraffic && <div className="text-xs text-muted mt-1">No events/orders in this range.</div>}
        </div>

        <div className="rounded-xl bg-card p-4 border border-borderc">
          <div className="text-sm text-muted">New customers</div>
          <div className="text-2xl font-semibold mt-2">{newCustomersCount > 0 ? newCustomersCount : (hasTraffic ? 0 : 'No data')}</div>
        </div>

        <div className="rounded-xl bg-card p-4 border border-borderc">
          <div className="text-sm text-muted">Returning customers</div>
          <div className="text-2xl font-semibold mt-2">{returningCustomersCount > 0 ? returningCustomersCount : (hasTraffic ? 0 : 'No data')}</div>
          <div className="text-sm text-muted mt-2">LTV proxy: {ltvProxy > 0 ? `${ltvProxy}` : (hasTraffic ? '0' : 'No data')}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card p-6 border border-borderc">
          <h3 className="text-lg font-semibold">Funnel</h3>
          {!hasTraffic ? (
            <div className="mt-3 text-sm text-muted">No data — funnel will appear after traffic.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {funnelSteps.map((s, idx) => (
                <div key={s} className="flex items-center justify-between">
                  <div className="capitalize text-sm">{s.replace('_',' ')}</div>
                  <div className="text-sm">
                    <strong>{funnelCounts[idx]}</strong>
                    {idx > 0 && (funnelCounts[idx-1] > 0 ? ` • ${(funnelCounts[idx] / funnelCounts[idx-1] * 100).toFixed(1)}%` : ' • —')}
                  </div>
                </div>
              ))}
              <div className="mt-2 text-xs text-muted">Delivered: {deliveredCount}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">Popular categories</h3>
            {popularCategories.length === 0 ? (
              <div className="mt-3 text-sm text-muted">No data</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {popularCategories.map(([slug, c]) => (
                  <li key={slug} className="flex items-center justify-between"><div className="text-sm">{slug}</div><div className="text-sm font-medium">{c}</div></li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">Popular brands</h3>
            {popularBrands.length === 0 ? (
              <div className="mt-3 text-sm text-muted">No data</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {popularBrands.map(([slug, c]) => (
                  <li key={slug} className="flex items-center justify-between"><div className="text-sm">{slug}</div><div className="text-sm font-medium">{c}</div></li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Orders needing action</h3>
        <div className="mt-3">
          <OrdersQueueClient initial={(ordersQueue ?? [])} />
        </div>
      </div>
    </div>
  )
}
