import AdminShell from "../../components/admin/AdminShell"

export const metadata = {
  title: 'Zuma Admin'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans">
      <AdminShell>{children}</AdminShell>
    </div>
  )
}
