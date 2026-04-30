import { supabaseAdmin } from '../../../lib/supabase/server'
import OrdersPageUI from '../../../components/admin/OrdersPageUI'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    page?: string
    sort?: string
    dir?: string // 'asc' | 'desc'
  }
}) {
  const query = searchParams?.q || ''
  const currentPage = Number(searchParams?.page) || 1
  const sort = searchParams?.sort || 'created_at'
  const dir = searchParams?.dir || 'desc'
  const limit = 20

  const from = (currentPage - 1) * limit
  const to = from + limit - 1

  // Start building the query
  let supabaseQuery = supabaseAdmin
    .from('orders')
    .select('id, order_number, customer_name, customer_email, customer_whatsapp, status, total_amount, currency, created_at, customer:customers(id, name, email, whatsapp_e164)', { count: 'exact' })

  // Search filter
  if (query) {
    supabaseQuery = supabaseQuery.or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_email.ilike.%${query}%,customer_whatsapp.ilike.%${query}%`)
  }

  // Sort
  supabaseQuery = supabaseQuery.order(sort, { ascending: dir === 'asc' })

  // Pagination
  supabaseQuery = supabaseQuery.range(from, to)

  const { data: orders, count, error } = await supabaseQuery

  return (
    <OrdersPageUI
      orders={(orders ?? []) as any[]}
      count={count ?? 0}
      limit={limit}
      query={query}
      error={error?.message}
    />
  )
}
