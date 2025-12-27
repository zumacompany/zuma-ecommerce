import SiteAdmin from '../../../components/admin/SiteAdmin'

export default function AdminSitePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Site</h1>
      <p className="mt-2 text-sm text-muted">Edit home content and site settings (WhatsApp number, etc).</p>

      <div className="mt-6">
        <SiteAdmin />
      </div>
    </div>
  )
}
