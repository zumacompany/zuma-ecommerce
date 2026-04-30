import { supabaseAdmin } from '../../../lib/supabase/server'
import BrandsPageUI from '../../../components/admin/BrandsPageUI'

export const dynamic = 'force-dynamic'

export default async function AdminBrandsPage() {
  // Fetch brands with category info
  const { data: brands, error: brandsError } = await supabaseAdmin
    .from('brands')
    .select('*, category:categories(id, name, slug)')
    .order('created_at', { ascending: false })

  // Fetch categories for the form
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug')
    .order('name')

  if (brandsError) {
    return (
      <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm flex flex-col items-center text-center">
        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-lg font-bold text-foreground">Erro ao carregar marcas</h3>
        <p className="mt-2 text-sm text-muted max-w-xs">{brandsError.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-zuma-500 text-white rounded-xl text-sm font-semibold hover:bg-zuma-600 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <BrandsPageUI
      initialBrands={brands || []}
      categories={categories || []}
    />
  )
}
