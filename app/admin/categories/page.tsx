import { supabaseAdmin } from '../../../lib/supabase/server'
import CategoriesPageUI from '../../../components/admin/CategoriesPageUI'

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

  return <CategoriesPageUI categories={categories || []} />
}
