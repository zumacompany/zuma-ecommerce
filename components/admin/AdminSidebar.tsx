"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin/offers', label: 'Offers' },
  { href: '/admin/payment-methods', label: 'Payment Methods' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/site', label: 'Site (CMS)' },
  { href: '/admin/analytics', label: 'Analytics' },
]

export default function AdminSidebar() {
  const pathname = usePathname() || ''

  return (
    <aside className="w-60 flex-shrink-0 border-r border-borderc bg-background min-h-screen p-4">
      <div className="mb-6">
        <Link href="/admin" className="text-xl font-bold">Zuma Admin</Link>
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={`block px-3 py-2 rounded ${pathname === n.href ? 'bg-zuma-100 font-medium' : 'hover:bg-zuma-50 text-sm'}`}>
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 text-xs text-muted">Empty states show "No data" + CTA (Create / Add) where applicable.</div>
    </aside>
  )
}
