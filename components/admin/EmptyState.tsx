"use client"
import Link from 'next/link'

export default function EmptyState({ title = 'No data', description, ctaLabel, ctaHref, onClick }: { title?: string; description?: string; ctaLabel?: string; ctaHref?: string; onClick?: () => void }) {
  return (
    <div className="rounded-lg border border-borderc p-6 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      {(ctaLabel && (ctaHref || onClick)) && (
        <div className="mt-4">
          {ctaHref ? (
            <Link href={ctaHref} className="inline-block px-4 py-2 rounded bg-zuma-500 text-white">{ctaLabel}</Link>
          ) : (
            <button onClick={onClick} className="inline-block px-4 py-2 rounded bg-zuma-500 text-white">{ctaLabel}</button>
          )}
        </div>
      )}
    </div>
  )
}
