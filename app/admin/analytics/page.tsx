import { supabaseAdmin } from "../../../lib/supabase/server"
import AnalyticsDashboard from "../../../components/admin/AnalyticsDashboard"

export const dynamic = "force-dynamic"

type SearchParams = { [key: string]: string | string[] | undefined }

type AnalyticsEvent = {
  event_name: string
  created_at: string
}

type OrderRow = {
  created_at: string
  total_amount: number | null
  status: string | null
}

const EVENT_NAMES = [
  "page_view",
  "checkout_started",
  "order_created",
  "click_buy",
  "whatsapp_clicked",
]

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function parseRange(searchParams: SearchParams) {
  const presetRaw = typeof searchParams.preset === "string" ? searchParams.preset : "30d"
  const preset = ["7d", "30d", "90d", "custom"].includes(presetRaw) ? presetRaw : "30d"

  const now = new Date()
  let end = endOfDay(now)
  let start: Date

  if (preset === "custom") {
    const startParam = typeof searchParams.start === "string" ? new Date(searchParams.start) : null
    const endParam = typeof searchParams.end === "string" ? new Date(searchParams.end) : null

    start = startParam && !isNaN(startParam.getTime()) ? startOfDay(startParam) : startOfDay(new Date(end.getTime() - 29 * 86400000))
    end = endParam && !isNaN(endParam.getTime()) ? endOfDay(endParam) : end
  } else {
    const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30
    start = startOfDay(new Date(end.getTime() - (days - 1) * 86400000))
  }

  if (start > end) {
    const tmp = start
    start = end
    end = tmp
  }

  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
  const prevEnd = endOfDay(new Date(start.getTime() - 86400000))
  const prevStart = startOfDay(new Date(prevEnd.getTime() - (dayCount - 1) * 86400000))

  return { preset, start, end, prevStart, prevEnd, dayCount }
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function buildSeries(start: Date, end: Date, orders: OrderRow[], events: AnalyticsEvent[]) {
  const dayKeys: string[] = []
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    dayKeys.push(dateKey(d))
  }

  const buckets = new Map(
    dayKeys.map((key) => [
      key,
      { revenue: 0, orders: 0, views: 0, checkouts: 0, created: 0 },
    ])
  )

  for (const order of orders) {
    if (!order.created_at) continue
    const key = dateKey(new Date(order.created_at))
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.orders += 1
    if ((order.status || "").toLowerCase() === "delivered") {
      bucket.revenue += Number(order.total_amount || 0)
    }
  }

  for (const event of events) {
    if (!event.created_at) continue
    const key = dateKey(new Date(event.created_at))
    const bucket = buckets.get(key)
    if (!bucket) continue
    if (event.event_name === "page_view") bucket.views += 1
    if (event.event_name === "checkout_started") bucket.checkouts += 1
    if (event.event_name === "order_created") bucket.created += 1
  }

  const series = dayKeys.map((key) => {
    const bucket = buckets.get(key) || { revenue: 0, orders: 0, views: 0, checkouts: 0, created: 0 }
    const label = new Date(key + "T00:00:00Z").toLocaleDateString("pt-MZ", {
      day: "2-digit",
      month: "short",
    })
    return { date: key, label, ...bucket }
  })

  const max = {
    revenue: Math.max(1, ...series.map((p) => p.revenue)),
    orders: Math.max(1, ...series.map((p) => p.orders)),
    views: Math.max(1, ...series.map((p) => p.views)),
    checkouts: Math.max(1, ...series.map((p) => p.checkouts)),
    created: Math.max(1, ...series.map((p) => p.created)),
  }

  const totals = series.reduce(
    (acc, cur) => {
      acc.revenue += cur.revenue
      acc.orders += cur.orders
      acc.views += cur.views
      acc.checkouts += cur.checkouts
      acc.created += cur.created
      return acc
    },
    { revenue: 0, orders: 0, views: 0, checkouts: 0, created: 0 }
  )

  return { series, max, totals }
}

function buildTotals(orders: OrderRow[], events: AnalyticsEvent[]) {
  let revenue = 0
  let ordersCount = 0
  let views = 0
  let checkouts = 0
  let created = 0

  for (const order of orders) {
    ordersCount += 1
    if ((order.status || "").toLowerCase() === "delivered") {
      revenue += Number(order.total_amount || 0)
    }
  }

  for (const event of events) {
    if (event.event_name === "page_view") views += 1
    if (event.event_name === "checkout_started") checkouts += 1
    if (event.event_name === "order_created") created += 1
  }

  return { revenue, orders: ordersCount, views, checkouts, created }
}

function buildEventCounts(events: AnalyticsEvent[]) {
  const counts = new Map<string, number>()
  for (const name of EVENT_NAMES) counts.set(name, 0)
  for (const event of events) {
    if (!counts.has(event.event_name)) continue
    counts.set(event.event_name, (counts.get(event.event_name) || 0) + 1)
  }
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }))
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const { start, end, prevStart, prevEnd } = parseRange(searchParams)

  const [ordersRes, eventsRes, prevOrdersRes, prevEventsRes] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("created_at, total_amount, status")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabaseAdmin
      .from("analytics_events")
      .select("event_name, created_at")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .in("event_name", EVENT_NAMES),
    supabaseAdmin
      .from("orders")
      .select("created_at, total_amount, status")
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString()),
    supabaseAdmin
      .from("analytics_events")
      .select("event_name, created_at")
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString())
      .in("event_name", EVENT_NAMES),
  ])

  if (ordersRes.error || eventsRes.error) {
    const err = ordersRes.error || eventsRes.error
    return (
      <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm flex flex-col items-center text-center">
        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">Erro ao carregar analytics</h3>
        <p className="mt-2 text-sm text-muted max-w-xs">{err?.message}</p>
      </div>
    )
  }

  const { series, max, totals } = buildSeries(
    start,
    end,
    (ordersRes.data || []) as OrderRow[],
    (eventsRes.data || []) as AnalyticsEvent[]
  )

  const prevTotals = buildTotals(
    (prevOrdersRes.data || []) as OrderRow[],
    (prevEventsRes.data || []) as AnalyticsEvent[]
  )

  const eventCounts = buildEventCounts((eventsRes.data || []) as AnalyticsEvent[])

  const rangeLabel = `${start.toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
  })} - ${end.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short" })}`

  return (
    <AnalyticsDashboard
      rangeLabel={rangeLabel}
      series={series}
      totals={totals}
      prevTotals={prevTotals}
      max={max}
      eventCounts={eventCounts}
    />
  )
}
