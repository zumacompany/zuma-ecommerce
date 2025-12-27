import CategoriesAdmin from '../../../components/admin/CategoriesAdmin'

export default function AdminCategoriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="mt-2 text-sm text-muted">Manage categories used in the storefront.</p>

      <div className="mt-6">
        <CategoriesAdmin />
      </div>
    </div>
  )
}
