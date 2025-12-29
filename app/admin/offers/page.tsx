import { supabaseAdmin } from '../../../lib/supabase/server'
import OffersManager from '../../../components/admin/OffersManager'

export const dynamic = 'force-dynamic'

export default async function AdminOffersPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const brandFilter = typeof searchParams.brand === 'string' ? searchParams.brand : ''
  const regionFilter = typeof searchParams.region === 'string' ? searchParams.region : ''
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : ''

  // Fetch all brands for filter dropdown
  const { data: brands } = await supabaseAdmin
    .from('brands')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  // Fetch all regions for filter dropdown
  const { data: regions } = await supabaseAdmin
    .from('regions')
    .select('code, name')
    .order('name')

  console.log('🔍 DEBUG - Brands:', brands)
  console.log('🔍 DEBUG - Regions:', regions)

  // Fetch offers with filters
  let offersQuery = supabaseAdmin
    .from('offers')
    .select('*, brand:brands(id, name, slug)')
    .order('created_at', { ascending: false })

  if (brandFilter) offersQuery = offersQuery.eq('brand_id', brandFilter)
  if (regionFilter) offersQuery = offersQuery.eq('region_code', regionFilter)
  if (statusFilter) offersQuery = offersQuery.eq('status', statusFilter)

  const { data: offersData, error: offersError } = await offersQuery

  console.log('🔍 DEBUG - Offers Data:', offersData)
  console.log('🔍 DEBUG - Filters:', { brandFilter, regionFilter, statusFilter })

  // Manually join with regions
  const offers = offersData?.map((offer: any) => ({
    ...offer,
    region: regions?.find((r: any) => r.code === offer.region_code) || null
  })) || []

  console.log('🔍 DEBUG - Offers with regions:', offers)

  if (offersError) {
    return (
      <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm flex flex-col items-center text-center">
        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">Erro ao carregar ofertas</h3>
        <p className="mt-2 text-sm text-muted max-w-xs">{offersError.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ofertas</h1>
        <p className="mt-1 text-sm text-muted">Gerencie ofertas associadas a marcas e regiões.</p>
      </div>

      <OffersManager
        initialOffers={offers || []}
        brands={brands || []}
        regions={regions || []}
        currentFilters={{
          brand: brandFilter,
          region: regionFilter,
          status: statusFilter
        }}
      />
    </div>
  )
}
