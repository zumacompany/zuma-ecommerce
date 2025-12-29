import Link from 'next/link'
import { Plus } from 'lucide-react'
import EmptyState from '../../../components/admin/EmptyState'
import { supabaseAdmin } from '../../../lib/supabase/server'
import AdminSearch from '../../../components/admin/AdminSearch'
import PaginationControls from '../../../components/admin/PaginationControls'
import OrdersTable from '../../../components/admin/OrdersTable'

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
    // Note: Search on related tables (like customers) is tricky in Supabase basic filtering.
    // For MVP, we'll search on the denormalized fields in orders table + order_number
    supabaseQuery = supabaseQuery.or(`order_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_email.ilike.%${query}%,customer_whatsapp.ilike.%${query}%`)
  }

  // Sort
  // Note: Sorting by related fields (customer.name) is also complex. Sticking to direct fields.
  supabaseQuery = supabaseQuery.order(sort, { ascending: dir === 'asc' })

  // Pagination
  supabaseQuery = supabaseQuery.range(from, to)

  const { data: orders, count, error } = await supabaseQuery

  if (error) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Error</h3>
        <p className="mt-2 text-sm text-muted">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="mt-2 text-sm text-muted">Manage user orders</p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-2 rounded-lg bg-zuma-500 px-4 py-2 text-sm font-semibold text-white hover:bg-zuma-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </Link>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-sm">
        <AdminSearch placeholder="Search order #, customer, email..." />
      </div>

      <div className="rounded-xl bg-card border border-borderc overflow-hidden">
        {(!orders || orders.length === 0) ? (
          <div className="p-6 text-sm text-muted">
            {query ? `No orders found matching "${query}"` : <EmptyState title="No orders" description="No orders found." ctaLabel="Reload" ctaHref="/admin/orders" />}
          </div>
        ) : (
          <>
            <OrdersTable orders={orders} />
            <PaginationControls count={count ?? 0} limit={limit} />
          </>
        )}
      </div>
    </div>
  )
}
