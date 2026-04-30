"use client"

import AnalyticsRangePicker from "./AnalyticsRangePicker"
import { useI18n } from "../../lib/i18n"

type SeriesPoint = {
  date: string
  label: string
  revenue: number
  orders: number
  views: number
  checkouts: number
  created: number
}

type Totals = {
  revenue: number
  orders: number
  views: number
  checkouts: number
  created: number
}

type MaxValues = {
  revenue: number
  orders: number
  views: number
  checkouts: number
  created: number
}

type EventCount = { name: string; count: number }

type AnalyticsDashboardProps = {
  rangeLabel: string
  series: SeriesPoint[]
  totals: Totals
  prevTotals: Totals
  max: MaxValues
  eventCounts: EventCount[]
}

function deltaPercent(current: number, previous: number) {
  if (!previous) return null
  return (current - previous) / previous
}

function formatDelta(delta: number | null) {
  if (delta === null) return "—"
  const sign = delta >= 0 ? "+" : ""
  return `${sign}${Math.round(delta * 100)}%`
}

function deltaTone(delta: number | null) {
  if (delta === null) return "muted"
  if (delta > 0.01) return "success"
  if (delta < -0.01) return "danger"
  return "muted"
}

export default function AnalyticsDashboard({
  rangeLabel,
  series,
  totals,
  prevTotals,
  max,
  eventCounts,
}: AnalyticsDashboardProps) {
  const { locale } = useI18n()
  const localeTag = locale === "pt" ? "pt-MZ" : "en-US"

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(localeTag, {
      style: "currency",
      currency: "MZN",
      maximumFractionDigits: 0,
    }).format(value || 0)

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 }).format(value || 0)

  const conversion = totals.views ? totals.created / totals.views : 0
  const prevConversion = prevTotals.views ? prevTotals.created / prevTotals.views : 0

  const revenueDelta = deltaPercent(totals.revenue, prevTotals.revenue)
  const ordersDelta = deltaPercent(totals.orders, prevTotals.orders)
  const viewsDelta = deltaPercent(totals.views, prevTotals.views)
  const conversionDelta = deltaPercent(conversion, prevConversion)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Analytics</p>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">{rangeLabel}</p>
        </div>
        <AnalyticsRangePicker />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita (entregue)"
          value={formatCurrency(totals.revenue)}
          delta={formatDelta(revenueDelta)}
          tone={deltaTone(revenueDelta)}
        />
        <KpiCard
          label="Pedidos"
          value={formatNumber(totals.orders)}
          delta={formatDelta(ordersDelta)}
          tone={deltaTone(ordersDelta)}
        />
        <KpiCard
          label="Page views"
          value={formatNumber(totals.views)}
          delta={formatDelta(viewsDelta)}
          tone={deltaTone(viewsDelta)}
        />
        <KpiCard
          label="Conversão"
          value={`${Math.round(conversion * 100)}%`}
          delta={formatDelta(conversionDelta)}
          tone={deltaTone(conversionDelta)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Receita & Pedidos</h2>
              <p className="text-sm text-muted">Comparativo diário</p>
            </div>
            <Legend items={[
              { label: "Receita", className: "bg-zuma-500" },
              { label: "Pedidos", className: "bg-muted" },
            ]} />
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {series.map((point) => {
              const revenueHeight = max.revenue ? (point.revenue / max.revenue) * 100 : 0
              const ordersHeight = max.orders ? (point.orders / max.orders) * 100 : 0
              return (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end gap-1">
                    <div
                      className="flex-1 rounded-t-lg bg-zuma-500/80"
                      style={{ height: `${revenueHeight}%` }}
                    />
                    <div
                      className="flex-1 rounded-t-lg bg-muted/40"
                      style={{ height: `${ordersHeight}%` }}
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                    {point.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Funnel</h2>
              <p className="text-sm text-muted">Views → Checkout → Pedido</p>
            </div>
            <Legend items={[
              { label: "Views", className: "bg-muted" },
              { label: "Checkout", className: "bg-zuma-500" },
              { label: "Pedidos", className: "bg-success-500" },
            ]} />
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {series.map((point) => {
              const viewsHeight = max.views ? (point.views / max.views) * 100 : 0
              const checkoutHeight = max.checkouts ? (point.checkouts / max.checkouts) * 100 : 0
              const createdHeight = max.created ? (point.created / max.created) * 100 : 0
              return (
                <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-36 w-full items-end gap-1">
                    <div className="flex-1 rounded-t-lg bg-muted/40" style={{ height: `${viewsHeight}%` }} />
                    <div className="flex-1 rounded-t-lg bg-zuma-500/80" style={{ height: `${checkoutHeight}%` }} />
                    <div className="flex-1 rounded-t-lg bg-success-500/80" style={{ height: `${createdHeight}%` }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                    {point.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-borderc bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground">Eventos principais</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {eventCounts.map((ev) => (
            <div key={ev.name} className="rounded-xl border border-borderc bg-muted/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{ev.name}</p>
              <p className="mt-2 text-xl font-semibold text-foreground">{formatNumber(ev.count)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string
  value: string
  delta: string
  tone: "success" | "danger" | "muted"
}) {
  const toneClass =
    tone === "success"
      ? "text-success-700"
      : tone === "danger"
      ? "text-danger-700"
      : "text-muted"

  return (
    <div className="rounded-2xl border border-borderc bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      <p className={`mt-2 text-xs font-semibold ${toneClass}`}>{delta}</p>
    </div>
  )
}

function Legend({ items }: { items: { label: string; className: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} />
          {item.label}
        </div>
      ))}
    </div>
  )
}
