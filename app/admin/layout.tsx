import AdminSidebar from '../../components/admin/AdminSidebar'
import AdminTopBar from '../../components/admin/AdminTopBar'

export const metadata = {
  title: 'Zuma Admin'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex overflow-hidden bg-background dark:bg-zinc-950">
      <AdminSidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl px-6">
          <AdminTopBar />
          <main className="py-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
