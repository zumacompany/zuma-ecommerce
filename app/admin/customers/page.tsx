import { supabaseAdmin } from '../../../lib/supabase/server'
import CustomersPageUI from '../../../components/admin/CustomersPageUI'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : ''
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : ''
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'created_at'
  const dir = typeof searchParams.dir === 'string' ? searchParams.dir : 'desc'
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1
  const limit = 20

  const start = (page - 1) * limit
  const end = start + limit - 1

  let supabaseQuery = supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact' })

  if (statusFilter) {
    supabaseQuery = supabaseQuery.eq('status', statusFilter)
  }

  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,whatsapp_e164.ilike.%${query}%`)
  }

  const { data: customers, count, error } = await supabaseQuery
    .order(sort, { ascending: dir === 'asc' })
    .range(start, end)

  return (
    <CustomersPageUI
      customers={(customers ?? []) as any[]}
      count={count ?? 0}
      limit={limit}
      query={query}
      error={error?.message}
    />
  )
}
