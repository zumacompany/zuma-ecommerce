import OffersAdmin from '../../../components/admin/OffersAdmin'

export default function AdminOffersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Offers</h1>
      <p className="mt-2 text-sm text-muted">Manage offers associated with brands and regions.</p>

      <div className="mt-6">
        <OffersAdmin />
      </div>
    </div>
  )
}
