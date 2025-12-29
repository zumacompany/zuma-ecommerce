import Link from 'next/link'
import { supabaseAdmin } from '../../../lib/supabase/server'
import CustomersTable from '../../../components/admin/CustomersTable'
import AdminSearch from '../../../components/admin/AdminSearch'
import PaginationControls from '../../../components/admin/PaginationControls'
import EmptyState from '../../../components/admin/EmptyState'

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

  if (error) {
    return (
      <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">Erro ao carregar clientes</h3>
        <p className="mt-2 text-sm text-muted max-w-xs">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-zuma-500 text-white rounded-xl text-sm font-semibold hover:bg-zuma-600 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted">Gerencie sua base de clientes e acompanhe o valor gasto</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted bg-muted/30 px-3 py-1 rounded-full border border-borderc">
            {count || 0} Clientes no total
          </span>
        </div>
      </div>

      <div className="bg-card p-4 rounded-2xl border border-borderc shadow-sm">
        <AdminSearch placeholder="Pesquisar por nome, email ou WHATSAPP..." />
      </div>

      {!customers || customers.length === 0 ? (
        <EmptyState
          title={query ? "Nenhum cliente encontrado" : "Nenhum cliente ainda"}
          description={query ? `Não encontramos clientes correspondentes a "${query}"` : "Sua lista de clientes aparecerá aqui assim que os pedidos começarem a chegar."}
          ctaLabel={query ? "Limpar Pesquisa" : undefined}
          ctaHref={query ? "/admin/customers" : undefined}
        />
      ) : (
        <>
          <CustomersTable customers={customers as any[]} />
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <PaginationControls count={count ?? 0} limit={limit} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
