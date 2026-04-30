"use client"

import Link from "next/link"
import { useI18n } from "../../lib/i18n"

const flow = [
  { key: "categories", href: "/admin/categories", labelKey: "nav.categories" },
  { key: "brands", href: "/admin/brands", labelKey: "nav.brands" },
  { key: "regions", href: "/admin/regions", labelKey: "nav.regions" },
  { key: "offers", href: "/admin/offers", labelKey: "nav.offers" },
  { key: "inventory", href: "/admin/inventory", labelKey: "nav.inventory" },
] as const

export type CatalogFlowKey = (typeof flow)[number]["key"]

export default function CatalogFlowBar({ current }: { current: CatalogFlowKey }) {
  const { t } = useI18n()
  const currentIndex = flow.findIndex((item) => item.key === current)
  const nextItem = flow[currentIndex + 1] || flow[currentIndex - 1]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-borderc bg-card px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        <span className="rounded-full border border-borderc px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("navGroup.merchandising")}
        </span>
        <span className="text-muted">/</span>
        {flow.map((item, index) => {
          const isCurrent = item.key === current
          const isPast = index < currentIndex
          return (
            <span key={item.key} className="flex items-center gap-2">
              {index !== 0 && <span className="text-muted">→</span>}
              {isCurrent ? (
                <span className="text-foreground">{t(item.labelKey)}</span>
              ) : (
                <Link
                  href={item.href}
                  className={isPast ? "text-foreground/80 hover:text-foreground" : "text-muted hover:text-foreground"}
                >
                  {t(item.labelKey)}
                </Link>
              )}
            </span>
          )
        })}
      </div>

      {nextItem && (
        <Link
          href={nextItem.href}
          className="rounded-full border border-borderc px-4 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/10"
        >
          {t("common.goTo")} {t(nextItem.labelKey)}
        </Link>
      )}
    </div>
  )
}
