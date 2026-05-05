"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "../shared/ThemeToggle"
import LanguageSwitcher from "../shared/LanguageSwitcher"
import { useI18n } from "../../lib/i18n"
import { adminNavSections } from "./adminNav"

type AdminSidebarProps = {
  onNavigate?: () => void
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname() || ""
  const { t } = useI18n()

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-borderc bg-card/80 backdrop-blur-xl">
      <div className="shrink-0 flex items-center justify-between border-b border-borderc px-4 py-3">
        <Link href="/admin" className="text-base font-semibold tracking-tight text-foreground">
          Zuma Admin
        </Link>
        <span className="rounded-full border border-borderc px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
          {t("navGroup.operations")}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <nav className="space-y-4">
          {adminNavSections.map((section) => (
            <div key={section.labelKey} className="space-y-1">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {t(section.labelKey)}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1 text-[13px] font-semibold transition ${
                        isActive
                          ? "bg-zuma-500/10 text-zuma-700 ring-1 ring-zuma-500/15 dark:text-zuma-300"
                          : "text-muted hover:bg-muted/10 hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                          isActive
                            ? "border-zuma-500/30 bg-zuma-500/10 text-zuma-600"
                            : "border-transparent bg-muted/20 text-muted group-hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="flex-1">{t(item.labelKey)}</span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? "bg-zuma-500" : "bg-transparent"
                        }`}
                      />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="shrink-0 space-y-3 border-t border-borderc px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-muted">{t("common.theme")}</span>
          <ThemeToggle compact />
        </div>
        <LanguageSwitcher compact />
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-borderc bg-card px-4 py-1.5 text-[13px] font-semibold text-foreground transition hover:bg-muted/10"
          title={t("common.logout")}
        >
          {t("common.logout")}
        </Link>
      </div>
    </aside>
  )
}
