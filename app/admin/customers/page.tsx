import { supabaseAdmin } from '../../../lib/supabase/server'
import CustomersPageUI from '../../../components/admin/CustomersPageUI'
import { parseEnumParam, parseListParams } from '@/src/server/http/query-params'

export const dynamic = 'force-dynamic'

const CUSTOMERS_SORT_FIELDS = [
  'created_at',
  'name',
  'email',
  'last_order_at',
  'total_spent',
  'orders_count',
  'loyalty_points',
] as const

const CUSTOMER_STATUS_FILTERS = ['active', 'inactive'] as const

const PAGE_SIZE = 20

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { sort, dir, page, q } = parseListParams(searchParams, {
    allowedSort: CUSTOMERS_SORT_FIELDS,
    defaultSort: 'created_at',
    defaultDir: 'desc',
  })
  const statusFilter = parseEnumParam(searchParams.status, CUSTOMER_STATUS_FILTERS)

  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE - 1

  let supabaseQuery = supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact' })

  if (statusFilter) {
    supabaseQuery = supabaseQuery.eq('status', statusFilter)
  }

  if (q) {
    supabaseQuery = supabaseQuery.or(
      `name.ilike.%${q}%,email.ilike.%${q}%,whatsapp_e164.ilike.%${q}%`,
    )
  }

  const { data: customers, count, error } = await supabaseQuery
    .order(sort, { ascending: dir === 'asc' })
    .range(start, end)

  return (
    <CustomersPageUI
      customers={(customers ?? []) as any[]}
      count={count ?? 0}
      limit={PAGE_SIZE}
      query={q}
      error={error?.message}
    />
  )
}
