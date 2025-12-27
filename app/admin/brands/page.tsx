import BrandsAdmin from '../../../components/admin/BrandsAdmin'

export default function AdminBrandsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Brands</h1>
      <p className="mt-2 text-sm text-muted">Manage brands used in the storefront.</p>

      <div className="mt-6">
        <BrandsAdmin />
      </div>
    </div>
  )
}
