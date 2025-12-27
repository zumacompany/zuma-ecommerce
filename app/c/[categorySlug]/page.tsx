import Link from 'next/link'
import { supabaseAdmin } from '../../../lib/supabase/server'
import CategoryViewAnalytics from '../../../components/CategoryViewAnalytics'

type Props = {
  params: { categorySlug: string }
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = params

  // Fetch category
  const { data: category, error: catErr } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug')
    .eq('slug', categorySlug)
    .maybeSingle()

  if (catErr) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="mt-2 text-sm text-muted">{catErr.message}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!category) {
    return (
      <main className="py-8">
        <div className="container max-w-[1200px]">
          <nav className="text-sm text-muted mb-3">
            <Link href="/">Home</Link> / <span className="font-medium">No data</span>
          </nav>
          <div className="rounded-xl bg-card p-6 border border-borderc">
            <h2 className="text-2xl font-semibold">No data</h2>
            <p className="mt-2 text-sm text-muted">Category not found.</p>
          </div>
        </div>
      </main>
    )
  }

  // Fetch brands in this category
  const { data: brands, error: bErr } = await supabaseAdmin
    .from('brands')
    .select('id, name, slug, logo_path')
    .eq('category_id', category.id)
    .eq('status', 'active')
    .order('name')

  return (
    <main className="py-8">
      <div className="container max-w-[1200px]">
        <nav className="text-sm text-muted mb-3">
          <Link href="/">Home</Link> / <span className="font-medium">{category.name}</span>
        </nav>

        <h1 className="text-2xl font-semibold">{category.name}</h1>

        {bErr ? (
          <div className="mt-4 rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">Error</h3>
            <p className="mt-2 text-sm text-muted">{bErr.message}</p>
          </div>
        ) : !brands || brands.length === 0 ? (
          <div className="mt-4 rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">No data</h3>
            <p className="mt-2 text-sm text-muted">No brands available in this category yet.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {brands.map((b: any) => (
              <Link key={b.id} href={`/b/${b.slug}`} className="rounded-xl bg-card p-4 border border-borderc flex flex-col items-center gap-3 hover:shadow-pop">
                {b.logo_path ? (
                  <img src={b.logo_path} alt={b.name} className="h-20 object-contain" />
                ) : (
                  <div className="h-20 w-full flex items-center justify-center text-sm text-muted">No logo</div>
                )}
                <div className="text-sm font-medium">{b.name}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Client-side analytics */}
      <CategoryViewAnalytics categorySlug={category.slug} />
    </main>
  )
}
