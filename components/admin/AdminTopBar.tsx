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
    <div className="flex items-center justify-end gap-4 py-4 px-2 border-b border-borderc">
      <Link
        href="/"
        target="_blank"
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-borderc text-sm font-medium hover:bg-muted/10 transition-colors"
      >
        <span>Ver Loja</span>
        <svg className="w-4 h-4 text-muted/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Link>
    </div>
  )
}
