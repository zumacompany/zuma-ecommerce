import DashboardUI from '../../components/admin/DashboardUI'
import { supabaseAdmin } from '../../lib/supabase/server'
import { ORDER_QUEUE_STATUSES, type OrderStatus } from '@/src/server/modules/orders/order-status'

const DELIVERED_STATUS: OrderStatus = 'delivered'

type Props = { searchParams?: { [key: string]: string | undefined } }
type RpcError = { code?: string; message?: string } | null | undefined
type DashboardStats = {
  page_views: number
  popular_categories: Array<{ category_slug: string; views_count: number }>
}
type DeliveredOrder = {
  id: string
  total_amount: number | null
  created_at: string
}
type OrdersSalesSeriesPoint = {
  key: string
  startIso: string
  endIso: string
  sales: number
  orders: number
}
type CategorySalesPoint = {
  label: string
  sales: number
  revenue: number
  color: string | null
}

export const dynamic = 'force-dynamic'

function applyCreatedAtRange<T extends { gte: (column: string, value: string) => T; lte: (column: string, value: string) => T }>(
  query: T,
  startIso: string | null,
  endIso: string | null
) {
  let nextQuery = query
  if (startIso) nextQuery = nextQuery.gte('created_at', startIso)
  if (endIso) nextQuery = nextQuery.lte('created_at', endIso)
  return nextQuery
}

function isMissingDashboardStatsRpc(error: RpcError) {
  return error?.code === 'PGRST202'
    && typeof error?.message === 'string'
    && error.message.includes('public.get_dashboard_stats')
}

function getCategorySlug(metadata: unknown) {
  if (!metadata) return null
  if (typeof metadata === 'string') {
    try {
      return getCategorySlug(JSON.parse(metadata))
    } catch {
      return null
    }
  }

  if (typeof metadata !== 'object' || Array.isArray(metadata)) return null

  const slug = (metadata as Record<string, unknown>).category_slug
  return typeof slug === 'string' && slug.length > 0 ? slug : null
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function resolveSeriesRange(
  deliveredOrders: DeliveredOrder[],
  start: Date | null,
  end: Date | null,
  now: Date
) {
  if (start && end) {
    return {
      startMs: start.getTime(),
      endMs: end.getTime(),
    }
  }

  if (deliveredOrders.length === 0) {
    const fallbackStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    return {
      startMs: fallbackStart.getTime(),
      endMs: now.getTime(),
    }
  }

  const timestamps = deliveredOrders.map((order) => new Date(order.created_at).getTime())
  const minTimestamp = Math.min(...timestamps)
  const maxTimestamp = Math.max(...timestamps)

  if (minTimestamp === maxTimestamp) {
    return {
      startMs: minTimestamp,
      endMs: minTimestamp + 24 * 60 * 60 * 1000,
    }
  }

  return {
    startMs: minTimestamp,
    endMs: maxTimestamp,
  }
}

function buildOrdersSalesSeries(
  deliveredOrders: DeliveredOrder[],
  start: Date | null,
  end: Date | null,
  now: Date
): OrdersSalesSeriesPoint[] {
  const bucketCount = 7
  const { startMs, endMs } = resolveSeriesRange(deliveredOrders, start, end, now)
  const spanMs = Math.max(endMs - startMs, 1)
  const bucketSizeMs = spanMs / bucketCount

  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStartMs = startMs + index * bucketSizeMs
    const bucketEndMs =
      index === bucketCount - 1 ? endMs : startMs + (index + 1) * bucketSizeMs

    return {
      key: `bucket-${index}`,
      startIso: new Date(bucketStartMs).toISOString(),
      endIso: new Date(bucketEndMs).toISOString(),
      sales: 0,
      orders: 0,
    }
  })

  for (const order of deliveredOrders) {
    const createdAtMs = new Date(order.created_at).getTime()
    const rawIndex = Math.floor((createdAtMs - startMs) / bucketSizeMs)
    const bucketIndex = Math.min(bucketCount - 1, Math.max(0, rawIndex))
    buckets[bucketIndex].orders += 1
  }

  return buckets
}

function getBucketIndexForTimestamp(
  timestampMs: number,
  buckets: Array<{ startIso: string; endIso: string }>
) {
  const lastIndex = buckets.length - 1

  for (let index = 0; index < buckets.length; index += 1) {
    const bucketStart = new Date(buckets[index].startIso).getTime()
    const bucketEnd = new Date(buckets[index].endIso).getTime()
    const isLastBucket = index === lastIndex

    if (timestampMs >= bucketStart && (timestampMs < bucketEnd || (isLastBucket && timestampMs <= bucketEnd))) {
      return index
    }
  }

  return lastIndex
}

async function fetchCategoryAnalytics(
  deliveredOrders: DeliveredOrder[],
  ordersSalesSeries: OrdersSalesSeriesPoint[]
): Promise<{
  categorySales: CategorySalesPoint[]
  ordersSalesSeries: OrdersSalesSeriesPoint[]
}> {
  if (deliveredOrders.length === 0) {
    return {
      categorySales: [],
      ordersSalesSeries,
    }
  }

  const deliveredOrderIds = deliveredOrders.map((order) => order.id)
  const orderCreatedAt = new Map(
    deliveredOrders.map((order) => [order.id, new Date(order.created_at).getTime()])
  )
  const nextOrdersSalesSeries = ordersSalesSeries.map((point) => ({ ...point }))
  const categoryTotals = new Map<string, CategorySalesPoint>()

  for (const idsChunk of chunkArray(deliveredOrderIds, 200)) {
    const { data, error } = await supabaseAdmin
      .from('order_items')
      .select('order_id, qty, unit_price, offer:offers(brand:brands(category:categories(name, slug, color)))')
      .in('order_id', idsChunk)

    if (error) {
      console.error('Error fetching category analytics:', error)
      continue
    }

    for (const row of data ?? []) {
      const category = (row as any)?.offer?.brand?.category
      const label =
        category?.name
        ?? category?.slug
        ?? 'Uncategorized'
      const color = typeof category?.color === 'string' ? category.color : null
      const qty = Number((row as any)?.qty ?? 0)
      const revenue = qty * Number((row as any)?.unit_price ?? 0)
      const current = categoryTotals.get(label) ?? {
        label,
        sales: 0,
        revenue: 0,
        color,
      }

      current.sales += qty
      current.revenue += revenue
      current.color = current.color ?? color
      categoryTotals.set(label, current)

      const orderId = String((row as any)?.order_id ?? '')
      const createdAtMs = orderCreatedAt.get(orderId)

      if (createdAtMs !== undefined) {
        const bucketIndex = getBucketIndexForTimestamp(createdAtMs, nextOrdersSalesSeries)
        nextOrdersSalesSeries[bucketIndex].sales += qty
      }
    }
  }

  const categorySales = [...categoryTotals.values()].sort((left, right) => {
    if (right.revenue !== left.revenue) return right.revenue - left.revenue
    return right.sales - left.sales
  })

  return {
    categorySales,
    ordersSalesSeries: nextOrdersSalesSeries,
  }
}

async function fetchDashboardStatsFallback(startIso: string | null, endIso: string | null): Promise<DashboardStats> {
  const pageViewsQuery = applyCreatedAtRange(
    supabaseAdmin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'page_view'),
    startIso,
    endIso
  )

  const { count: pageViewsCount, error: pageViewsError } = await pageViewsQuery

  if (pageViewsError) {
    console.error('Error fetching page views fallback:', pageViewsError)
  }

  const categoryCounts = new Map<string, number>()
  const pageSize = 1000
  let from = 0

  while (true) {
    const categoryQuery = applyCreatedAtRange(
      supabaseAdmin
        .from('analytics_events')
        .select('metadata')
        .eq('event_name', 'view_category')
        .order('created_at', { ascending: true })
        .range(from, from + pageSize - 1),
      startIso,
      endIso
    )

    const { data, error } = await categoryQuery

    if (error) {
      console.error('Error fetching category views fallback:', error)
      break
    }

    const events = data ?? []

    for (const event of events) {
      const slug = getCategorySlug(event.metadata)
      if (!slug) continue
      categoryCounts.set(slug, (categoryCounts.get(slug) ?? 0) + 1)
    }

    if (events.length < pageSize) break
    from += pageSize
  }

  const popularCategories = [...categoryCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([category_slug, views_count]) => ({ category_slug, views_count }))

  return {
    page_views: pageViewsCount ?? 0,
    popular_categories: popularCategories,
  }
}

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
  const startIso = start?.toISOString() ?? null
  const endIso = end?.toISOString() ?? null

  // Fetch aggregated analytics via RPC
  const { data: statsFromRpc, error: statsErr } = await supabaseAdmin.rpc('get_dashboard_stats', {
    p_start_date: startIso,
    p_end_date: endIso
  })

  let statsRaw = statsFromRpc as DashboardStats | null

  if (statsErr && isMissingDashboardStatsRpc(statsErr)) {
    console.warn('get_dashboard_stats RPC unavailable, falling back to direct analytics queries', statsErr)
    statsRaw = await fetchDashboardStatsFallback(startIso, endIso)
  } else if (statsErr) {
    console.error('Error fetching dashboard stats:', statsErr)
  }

  const stats = statsRaw || { page_views: 0, popular_categories: [] }
  const pageViews = stats.page_views ?? 0

  // delivered orders & revenue
  let ordersQuery = supabaseAdmin.from('orders').select('id, total_amount, created_at')
  if (start && end) ordersQuery = ordersQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
  const { data: deliveredOrders } = await ordersQuery.eq('status', DELIVERED_STATUS)
  const delivered = (deliveredOrders ?? []) as DeliveredOrder[]
  const deliveredCount = delivered.length
  const estimatedRevenue = delivered.reduce((s, o) => s + (o.total_amount ?? 0), 0)
  const baseOrdersSalesSeries = buildOrdersSalesSeries(delivered, start, end, now)
  const { categorySales, ordersSalesSeries } = await fetchCategoryAnalytics(delivered, baseOrdersSalesSeries)

  // Customers metrics
  let newCustomersCount = 0
  if (start && end) {
    const { count } = await supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }).gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
    newCustomersCount = count ?? 0
  } else {
    const { count } = await supabaseAdmin.from('customers').select('id', { count: 'exact', head: true })
    newCustomersCount = count ?? 0
  }

  // Orders queue
  const { data: ordersQueue } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, customer_whatsapp, total_amount, currency, status, created_at')
    .in('status', ORDER_QUEUE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <DashboardUI
      rangeText={rangeText}
      estimatedRevenue={estimatedRevenue}
      deliveredCount={deliveredCount}
      newCustomersCount={newCustomersCount}
      pageViews={pageViews}
      ordersSalesSeries={ordersSalesSeries}
      categorySales={categorySales}
      ordersQueue={(ordersQueue ?? [])}
    />
  )
}
