"use client"
import ThemeToggle from '../ThemeToggle'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminTopBar() {
  const pathname = usePathname() || ''

  // derive a friendly title from the last part of path or leave blank
  const segments = pathname.split('/').filter(Boolean)
  const title = segments.length <= 2 ? (segments[1] ? segments[1].replace(/-/g, ' ') : 'Dashboard') : (segments[2] || '')

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-2 border-b border-borderc">
      <div className="text-lg font-semibold capitalize">{title || 'Dashboard'}</div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/" className="px-3 py-1 rounded border border-borderc text-sm">Logout</Link>
      </div>
    </div>
  )
}
