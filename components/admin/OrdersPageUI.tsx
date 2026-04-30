"use client";
import Link from "next/link"
import { Plus } from "lucide-react"
import EmptyState from "./EmptyState"
import PaginationControls from "./PaginationControls"
import OrdersTable from "./OrdersTable"
import { useI18n } from "../../lib/i18n"
import { card } from "../ui/classes"

type Order = {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_whatsapp: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    customer: {
        id: string;
        name: string;
        email: string;
        whatsapp_e164: string;
    } | null;
};

type OrdersPageUIProps = {
    orders: Order[];
    count: number;
    limit: number;
    query: string;
    error?: string;
};

export default function OrdersPageUI({
    orders,
    count,
    limit,
    query,
    error,
}: OrdersPageUIProps) {
    const { t } = useI18n();

  if (error) {
    return (
      <div className={card}>
        <h3 className="text-lg font-semibold">{t("common.error")}</h3>
        <p className="mt-2 text-sm text-muted">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("nav.orders")}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{t("orders.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("orders.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 rounded-xl bg-zuma-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zuma-600"
          >
            <Plus className="h-4 w-4" />
            {t("orders.createOrder")}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="rounded-full border border-borderc px-3 py-1.5 text-xs font-semibold text-foreground">
          {count} {t("orders.title")}
        </span>
      </div>

      <div className="rounded-2xl border border-borderc bg-card shadow-card">
        {!orders || orders.length === 0 ? (
          <div className="p-6 text-sm text-muted">
            {query ? (
              t("orders.noOrdersFound", { query })
            ) : (
              <EmptyState
                title={t("orders.noOrders")}
                description={t("orders.noOrdersDescription")}
                ctaLabel={t("orders.reload")}
                ctaHref="/admin/orders"
              />
            )}
          </div>
        ) : (
          <>
            <OrdersTable orders={orders} />
            <PaginationControls count={count} limit={limit} />
          </>
        )}
      </div>
    </div>
  )
}
