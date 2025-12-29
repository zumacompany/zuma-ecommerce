import { supabaseAdmin } from '../../../lib/supabase/server'
import CategoriesManager from '../../../components/admin/CategoriesManager'

// Force dynamic rendering to ensure we always fetch the latest data from the DB
export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  // Fetch categories directly from the database
  const { data: categories, error } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug, color, icon, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching categories:', error)
    return (
      <div className="p-8 text-center text-red-500">
        <p>Erro ao carregar categorias: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
        <p className="mt-1 text-sm text-muted">Gerencie as categorias usadas na loja.</p>
      </div>

      <CategoriesManager initialCategories={categories || []} />
    </div>
  )
}
