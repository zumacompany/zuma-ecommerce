import { supabaseAdmin } from '../../../lib/supabase/server'
import OrdersPageUI from '../../../components/admin/OrdersPageUI'
import { parseListParams } from '@/src/server/http/query-params'

export const dynamic = 'force-dynamic'

const ORDERS_SORT_FIELDS = [
  'created_at',
  'order_number',
  'customer_name',
  'customer_email',
  'status',
  'total_amount',
] as const

const PAGE_SIZE = 20

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    page?: string
    sort?: string
    dir?: string
  }
}) {
  const { sort, dir, page, q } = parseListParams(searchParams, {
    allowedSort: ORDERS_SORT_FIELDS,
    defaultSort: 'created_at',
    defaultDir: 'desc',
  })

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let supabaseQuery = supabaseAdmin
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_email, customer_whatsapp, status, total_amount, currency, created_at, customer:customers(id, name, email, whatsapp_e164)',
      { count: 'exact' },
    )

  if (q) {
    supabaseQuery = supabaseQuery.or(
      `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,customer_whatsapp.ilike.%${q}%`,
    )
  }

  supabaseQuery = supabaseQuery.order(sort, { ascending: dir === 'asc' })
  supabaseQuery = supabaseQuery.range(from, to)

  const { data: orders, count, error } = await supabaseQuery

  return (
    <OrdersPageUI
      orders={(orders ?? []) as any[]}
      count={count ?? 0}
      limit={PAGE_SIZE}
      query={q}
      error={error?.message}
    />
  )
}
