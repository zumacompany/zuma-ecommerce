"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/browser";
import { getStatusColor, getStatusLabel } from "@/lib/orderStatus";
import { formatRelativeTime, resolveRelativeTimeLocale } from "@/lib/formatRelativeTime";
import { normalizeOrderStatus } from "@/src/server/modules/orders/order-status.mapper";

type OrderDetail = {
  order_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  payment_method_name: string;
  items_count: number;
};

const copy = {
  pt: {
    subtitle: "Acompanhe o estado do pedido e confirme os dados principais antes do pagamento ou entrega.",
    notFound: "Não encontramos este pedido na sua conta.",
    notFoundHint: "Volte à sua lista de pedidos ou continue a navegar pela loja.",
    placedAt: "Criado",
    status: "Estado",
    payment: "Pagamento",
    items: "Itens",
    total: "Total",
    backToOrders: "Voltar aos pedidos",
    browse: "Explorar produtos",
    paymentPending: "A definir",
  },
  en: {
    subtitle: "Track this order and confirm the main details before payment or fulfillment.",
    notFound: "We could not find this order in your account.",
    notFoundHint: "Go back to your order list or continue browsing the store.",
    placedAt: "Created",
    status: "Status",
    payment: "Payment",
    items: "Items",
    total: "Total",
    backToOrders: "Back to orders",
    browse: "Browse products",
    paymentPending: "Pending",
  },
} as const;

export default function CustomerOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const { locale, t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderId = Array.isArray(params?.orderId) ? params.orderId[0] : params?.orderId;
  const pageCopy = copy[locale];

  useEffect(() => {
    if (authLoading) return;

    if (!user || !orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc("get_customer_orders", {
          p_auth_user_id: user.id,
          p_limit: 200,
          p_offset: 0,
        });

        if (rpcError) throw rpcError;

        const rows = Array.isArray(data) ? data : [];
        const match = rows.find((row: any) => row.order_id === orderId);

        if (!match) {
          setOrder(null);
          return;
        }

        setOrder({
          order_id: match.order_id,
          order_number: match.order_number,
          status: normalizeOrderStatus(match.status) ?? String(match.status ?? "new"),
          total_amount: Number(match.total_amount ?? 0),
          currency: match.currency,
          created_at: match.created_at,
          payment_method_name: match.payment_method_name ?? "",
          items_count: match.items_count ?? 0,
        });
      } catch (fetchError) {
        console.error("Error fetching customer order detail:", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : t("errors.generic"));
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [authLoading, orderId, user]);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.loading")}>
        <div className="h-24 rounded-2xl bg-muted/10 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-borderc bg-muted/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl border border-borderc bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">{pageCopy.notFound}</h1>
        <p className="mt-3 text-muted">{error ?? pageCopy.notFoundHint}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/cliente/pedidos"
            className="rounded-xl border border-borderc px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/10"
          >
            {pageCopy.backToOrders}
          </Link>
          <Link
            href="/browse"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {pageCopy.browse}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/cliente/pedidos"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← {pageCopy.backToOrders}
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-foreground">
            #{order.order_number}
          </h1>
          <p className="mt-2 max-w-2xl text-muted">{pageCopy.subtitle}</p>
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold ${getStatusColor(
            order.status
          )}`}
        >
          {getStatusLabel(order.status, t)}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-borderc bg-card p-5 shadow-sm">
          <p className="text-sm text-muted">{pageCopy.placedAt}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatRelativeTime(order.created_at, resolveRelativeTimeLocale(locale))}
          </p>
        </div>
        <div className="rounded-2xl border border-borderc bg-card p-5 shadow-sm">
          <p className="text-sm text-muted">{pageCopy.items}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{order.items_count}</p>
        </div>
        <div className="rounded-2xl border border-borderc bg-card p-5 shadow-sm">
          <p className="text-sm text-muted">{pageCopy.payment}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {order.payment_method_name || pageCopy.paymentPending}
          </p>
        </div>
        <div className="rounded-2xl border border-borderc bg-card p-5 shadow-sm">
          <p className="text-sm text-muted">{pageCopy.total}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {order.total_amount.toFixed(2)} {order.currency}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-borderc bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">{t("customer.orderDetails")}</h2>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">{t("checkout.orderNumber")}</dt>
            <dd className="mt-1 font-mono text-base font-semibold text-foreground">
              #{order.order_number}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{pageCopy.status}</dt>
            <dd className="mt-1 text-base font-semibold text-foreground">
              {getStatusLabel(order.status, t)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{pageCopy.payment}</dt>
            <dd className="mt-1 text-base font-semibold text-foreground">
              {order.payment_method_name || pageCopy.paymentPending}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{pageCopy.items}</dt>
            <dd className="mt-1 text-base font-semibold text-foreground">
              {order.items_count}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm text-muted">{pageCopy.total}</dt>
            <dd className="mt-1 text-xl font-bold text-foreground">
              {order.total_amount.toFixed(2)} {order.currency}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
