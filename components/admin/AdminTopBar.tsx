"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ExternalLink } from "lucide-react"
import AdminSearch from "./AdminSearch"
import { findAdminNavItem } from "./adminNav"
import { useI18n } from "../../lib/i18n"

type AdminTopBarProps = {
  onOpenNav: () => void
}

const searchPlaceholders: Record<string, string> = {
  "/admin/orders": "orders.searchPlaceholder",
  "/admin/customers": "customers.searchPlaceholder",
}

const searchableRoutes = Object.keys(searchPlaceholders)

export default function AdminTopBar({ onOpenNav }: AdminTopBarProps) {
  const pathname = usePathname() || ""
  const { t } = useI18n()
  const navItem = findAdminNavItem(pathname)
  const title = navItem ? t(navItem.labelKey) : "Admin"

  const showSearch = searchableRoutes.some((route) => pathname.startsWith(route))
  const placeholderKey =
    searchPlaceholders[
      searchableRoutes.find((route) => pathname.startsWith(route)) || ""
    ] || "common.searchPlaceholder"

  return (
    <div className="sticky top-0 z-30 border-b border-borderc bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNav}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-borderc bg-card text-muted transition hover:bg-muted/10 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
        </div>

        <div className="flex w-full flex-1 items-center gap-3 sm:max-w-[520px]">
          {showSearch && (
            <div className="w-full">
              <AdminSearch placeholder={t(placeholderKey)} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-borderc bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/10"
          >
            {t("common.viewStore")}
            <ExternalLink className="h-4 w-4 text-muted" />
          </Link>
        </div>
      </div>
    </div>
  )
}
