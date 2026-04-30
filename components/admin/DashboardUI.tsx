"use client"
import Link from "next/link"
import { ArrowUpRight, TrendingUp, Users, Eye, ClipboardList } from "lucide-react"
import { useI18n } from "../../lib/i18n"
import TimeRangePicker from "./TimeRangePicker"
import OrdersQueueClient from "./OrdersQueueClient"

type DashboardUIProps = {
  rangeText: string
  estimatedRevenue: number
  deliveredCount: number
  newCustomersCount: number
  pageViews: number
  ordersSalesSeries: Array<{
    key: string
    startIso: string
    endIso: string
    sales: number
    orders: number
  }>
  categorySales: Array<{
    label: string
    sales: number
    revenue: number
    color: string | null
  }>
  ordersQueue: any[]
}

const FALLBACK_CATEGORY_COLORS = ["#3b82f6", "#f97316", "#8b5cf6", "#22c55e", "#ef4444"]
const CATEGORY_COLOR_MAP: Record<string, string> = {
  "bg-gray-200": "#e5e7eb",
  "bg-orange-300": "#fdba74",
  "bg-purple-300": "#d8b4fe",
  "bg-green-300": "#86efac",
}

function resolveCategoryColor(color: string | null | undefined, fallbackIndex: number) {
  if (typeof color === "string") {
    const hexMatch = color.match(/bg-\[(#[0-9A-Fa-f]{6})\]/)
    if (hexMatch) return hexMatch[1]
    if (CATEGORY_COLOR_MAP[color]) return CATEGORY_COLOR_MAP[color]
  }

  return FALLBACK_CATEGORY_COLORS[fallbackIndex % FALLBACK_CATEGORY_COLORS.length]
}

export default function DashboardUI({
  rangeText,
  estimatedRevenue,
  deliveredCount,
  newCustomersCount,
  pageViews,
  ordersSalesSeries,
  categorySales,
  ordersQueue,
}: DashboardUIProps) {
  const { t, locale } = useI18n()
  const localeTag = locale === "pt" ? "pt-MZ" : "en-US"
  const totalSalesCount = ordersSalesSeries.reduce((sum, point) => sum + point.sales, 0)
  const totalCategoryRevenue = categorySales.reduce((sum, item) => sum + item.revenue, 0)
  const topCategorySales = categorySales.slice(0, 5)
  const categoryColorMap = new Map(
    topCategorySales.map((category, index) => [
      category.label,
      resolveCategoryColor(category.color, index),
    ])
  )
  const hasOrdersSalesData = ordersSalesSeries.some((point) => point.sales > 0 || point.orders > 0)
  const maxFunnelValue = Math.max(totalSalesCount, deliveredCount, 1)
  const salesWidth = Math.max(56, (totalSalesCount / maxFunnelValue) * 100)
  const ordersWidth = Math.max(42, (deliveredCount / maxFunnelValue) * 100)

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(localeTag, {
      style: "currency",
      currency: "MZN",
    })
  }

  const formatCompactCurrency = (amount: number) => {
    return amount.toLocaleString(localeTag, {
      style: "currency",
      currency: "MZN",
      notation: "compact",
      maximumFractionDigits: 1,
    })
  }

  const donutSegments =
    totalCategoryRevenue > 0
      ? (() => {
          let cursor = 0
          return topCategorySales
            .map((item, index) => {
              const portion = (item.revenue / totalCategoryRevenue) * 360
              const from = cursor
              cursor += portion
              const to = index === topCategorySales.length - 1 ? 360 : cursor
              const color = categoryColorMap.get(item.label) ?? resolveCategoryColor(item.color, index)
              return `${color} ${from}deg ${to}deg`
            })
            .join(", ")
        })()
      : null

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("dashboard.title")}
          </p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {t("dashboard.greeting")}
            </h1>
            <p className="text-sm text-muted">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-full border border-borderc bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/10"
            >
              {t("nav.orders")}
              <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
            </Link>
            <Link
              href="/admin/offers"
              className="inline-flex items-center gap-2 rounded-full border border-borderc bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/10"
            >
              {t("nav.offers")}
              <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
            </Link>
            <Link
              href="/admin/regions"
              className="inline-flex items-center gap-2 rounded-full border border-borderc bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/10"
            >
              {t("nav.regions")}
              <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-borderc bg-card px-4 py-2 text-xs font-semibold text-muted">
            {rangeText}
          </div>
          <TimeRangePicker />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-borderc bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zuma-500/10 text-zuma-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="rounded-full border border-borderc px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("dashboard.revenue")}
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("dashboard.estimatedRevenue")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(estimatedRevenue)}
          </p>
        </div>

        <div className="rounded-2xl border border-borderc bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-50 text-success-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <span className="rounded-full border border-borderc px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("dashboard.deliveredOrders")}
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("dashboard.deliveredOrders")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{deliveredCount}</p>
        </div>

        <div className="rounded-2xl border border-borderc bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-50 text-warning-700">
              <Users className="h-5 w-5" />
            </div>
            <span className="rounded-full border border-borderc px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("dashboard.customers")}
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("dashboard.newCustomers")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{newCustomersCount}</p>
        </div>

        <div className="rounded-2xl border border-borderc bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zuma-500/10 text-zuma-600">
              <Eye className="h-5 w-5" />
            </div>
            <span className="rounded-full border border-borderc px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("dashboard.visits")}
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("dashboard.visitors")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{pageViews}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {t("dashboard.ordersAndSales")}
              </h3>
            </div>
            <Link
              href="/admin/analytics"
              className="rounded-full border border-borderc px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/10"
            >
              {t("dashboard.viewReport")}
            </Link>
          </div>
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-borderc bg-muted/5 px-3 py-1.5 text-xs font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-zuma-500" />
                {t("dashboard.sales")}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-borderc bg-muted/5 px-3 py-1.5 text-xs font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {t("dashboard.deliveredOrders")}
              </div>
            </div>
            {hasOrdersSalesData ? (
              <div className="rounded-2xl border border-borderc bg-muted/5 p-6">
                <div className="mx-auto flex max-w-2xl flex-col items-center">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {rangeText}
                  </div>
                  <div className="mt-6 flex w-full flex-col items-center gap-4">
                    <div
                      className="flex min-h-[116px] items-center justify-between rounded-[28px] bg-gradient-to-r from-zuma-500 via-zuma-500 to-zuma-600 px-6 py-5 text-white shadow-lg"
                      style={{
                        width: `${salesWidth}%`,
                        clipPath: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)",
                      }}
                    >
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                          {t("dashboard.sales")}
                        </div>
                        <div className="mt-2 text-4xl font-semibold">{totalSalesCount}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                          {t("dashboard.revenue")}
                        </div>
                        <div className="mt-2 text-lg font-semibold">{formatCompactCurrency(estimatedRevenue)}</div>
                      </div>
                    </div>

                    <div className="h-6 w-px bg-borderc" />

                    <div
                      className="flex min-h-[96px] items-center justify-between rounded-[24px] bg-gradient-to-r from-emerald-400 to-emerald-600 px-6 py-5 text-white shadow-lg"
                      style={{
                        width: `${ordersWidth}%`,
                        clipPath: "polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)",
                      }}
                    >
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                          {t("dashboard.deliveredOrders")}
                        </div>
                        <div className="mt-2 text-4xl font-semibold">{deliveredCount}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                          {t("dashboard.sales")}
                        </div>
                        <div className="mt-2 text-lg font-semibold">
                          {deliveredCount > 0 ? (totalSalesCount / deliveredCount).toFixed(1) : "0.0"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid w-full gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-borderc bg-card px-4 py-3 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {t("dashboard.sales")}
                      </div>
                      <div className="mt-1 text-xl font-semibold text-foreground">{totalSalesCount}</div>
                    </div>
                    <div className="rounded-2xl border border-borderc bg-card px-4 py-3 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {t("dashboard.deliveredOrders")}
                      </div>
                      <div className="mt-1 text-xl font-semibold text-foreground">{deliveredCount}</div>
                    </div>
                    <div className="rounded-2xl border border-borderc bg-card px-4 py-3 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {t("dashboard.revenue")}
                      </div>
                      <div className="mt-1 text-xl font-semibold text-foreground">{formatCompactCurrency(estimatedRevenue)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-borderc bg-muted/5 text-sm text-muted">
                {t("website.noData")}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground">
            {t("dashboard.salesByCategory")}
          </h3>
          <div className="mt-6 flex items-center justify-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: donutSegments
                    ? `conic-gradient(${donutSegments})`
                    : "conic-gradient(rgba(59,130,246,0.12) 0deg 360deg)",
                }}
              />
              <div className="absolute inset-[14px] rounded-full bg-card" />
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">
                  {formatCompactCurrency(totalCategoryRevenue)}
                </div>
                <div className="text-xs text-muted">{t("dashboard.revenue")}</div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {topCategorySales.length > 0 ? (
              topCategorySales.map((category, index) => (
                <div key={category.label} className="flex items-center justify-between text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          categoryColorMap.get(category.label) ?? resolveCategoryColor(category.color, index),
                      }}
                    />
                    <span className="truncate">{category.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{formatCurrency(category.revenue)}</div>
                    <div className="text-[11px] text-muted">{category.sales} {t("dashboard.sales").toLowerCase()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-borderc bg-muted/5 px-4 py-6 text-center text-sm text-muted">
                {t("website.noData")}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-borderc bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderc px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t("dashboard.recentOrders")}</h3>
            <p className="text-sm text-muted">{t("orders.subtitle")}</p>
          </div>
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 rounded-xl bg-zuma-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zuma-600"
          >
            {t("dashboard.addOrder")}
          </Link>
        </div>
        <div className="p-6">
          <OrdersQueueClient initial={ordersQueue} />
        </div>
      </section>
    </div>
  )
}
