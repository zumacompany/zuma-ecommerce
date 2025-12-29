import Link from 'next/link'
import { supabaseAdmin } from '../../../lib/supabase/server'
import BrandOffersClient from '../../../components/BrandOffersClient'

type Props = {
  params: { brandSlug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { brandSlug } = params
  const regionParam = typeof searchParams?.region === 'string' ? searchParams?.region : undefined

  // Fetch brand
  const { data: brand, error: brandErr } = await supabaseAdmin
    .from('brands')
    .select('id, name, slug, logo_path, description_md')
    .eq('slug', brandSlug)
    .maybeSingle()

  if (brandErr) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="mt-2 text-sm text-muted">{brandErr.message}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!brand) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <nav className="text-sm text-muted mb-3">
            <Link href="/">Home</Link> / <span className="font-medium">No data</span>
          </nav>
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-2xl font-semibold">No data</h2>
            <p className="mt-2 text-sm text-muted">Brand not found.</p>
          </div>
        </div>
      </main>
    )
  }

  // Fetch offers for this brand
  const { data: offers, error: offersErr } = await supabaseAdmin
    .from('offers')
    .select('id, region_code, denomination_value, denomination_currency, price')
    .eq('brand_id', brand.id)
    .eq('status', 'active')
    .order('denomination_value')

  if (offersErr) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <nav className="text-sm text-muted mb-3">
            <Link href="/">Home</Link> / <span className="font-medium">{brand.name}</span>
          </nav>
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">Error</h3>
            <p className="mt-2 text-sm text-muted">{offersErr.message}</p>
          </div>
        </div>
      </main>
    )
  }

  const regions: string[] = Array.from(new Set((offers ?? []).map((o: any) => String(o.region_code ?? '')))).filter(Boolean) as string[]

  // Determine selected region (prefer URL param if valid)
  const selectedRegion = regionParam && regions.includes(regionParam) ? regionParam : regions[0] ?? null

  const offersForRegion = selectedRegion ? (offers ?? []).filter((o: any) => o.region_code === selectedRegion) : []

  return (
    <main className="py-8">
      <div className="container max-w-[1200px]">
        <nav className="text-sm text-muted mb-6">
          <Link href="/">Home</Link> / <span className="font-medium text-text">{brand.name}</span>
        </nav>

        <BrandOffersClient
          brand={brand}
          regions={regions}
          initialRegion={selectedRegion}
          initialOffers={offersForRegion}
        />
      </div>
    </main>
  )
}
