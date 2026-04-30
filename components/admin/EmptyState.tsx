"use client"
import Link from 'next/link'
import { useI18n } from '../../lib/i18n'

export default function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  onClick,
  icon
}: {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onClick?: () => void
  icon?: React.ReactNode
}) {
  const { t } = useI18n()
  const resolvedTitle = title ?? t('admin.common.noResults')
  return (
    <div className="rounded-2xl border border-dashed border-borderc p-12 text-center flex flex-col items-center justify-center">
      {icon && <div className="mb-4 text-muted/40">{icon}</div>}
      <h3 className="text-xl font-bold text-foreground">{resolvedTitle}</h3>
      {description && <p className="mt-3 text-sm text-muted max-w-xs mx-auto leading-relaxed">{description}</p>}
      {(ctaLabel && (ctaHref || onClick)) && (
        <div className="mt-8">
          {ctaHref ? (
            <Link href={ctaHref} className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-zuma-500 text-white text-sm font-semibold hover:bg-zuma-600 transition-all shadow-lg shadow-zuma-500/20">{ctaLabel}</Link>
          ) : (
            <button onClick={onClick} className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-zuma-500 text-white text-sm font-semibold hover:bg-zuma-600 transition-all shadow-lg shadow-zuma-500/20">{ctaLabel}</button>
          )}
        </div>
      )}
    </div>
  )
}
