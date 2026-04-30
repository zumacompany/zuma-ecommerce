"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/browser";

type CustomerSummary = {
  customer_id: string;
  loyalty_points: number;
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
};

const copy = {
  pt: {
    subtitle: "Veja o saldo de fidelidade acumulado na sua conta e acompanhe o impacto das suas compras.",
    empty: "Os seus pontos aparecerão aqui assim que tiver uma conta associada às suas compras.",
    balance: "Saldo atual",
    deliveredOrders: "Pedidos associados",
    totalSpent: "Total gasto",
    howItWorksTitle: "Como os pontos funcionam",
    howItWorksBody:
      "Os pontos são calculados a partir das compras concluídas e servem para preparar futuras campanhas e benefícios exclusivos.",
    keepShopping: "Continuar a comprar",
  },
  en: {
    subtitle: "Check the loyalty balance linked to your account and track the impact of your purchases.",
    empty: "Your points will appear here as soon as your purchases are linked to this account.",
    balance: "Current balance",
    deliveredOrders: "Linked orders",
    totalSpent: "Total spent",
    howItWorksTitle: "How points work",
    howItWorksBody:
      "Points are calculated from completed purchases and help unlock future campaigns and exclusive benefits.",
    keepShopping: "Keep shopping",
  },
} as const;

export default function CustomerPointsPage() {
  const { locale, t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageCopy = copy[locale];

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSummary(null);
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc("get_customer_by_auth_user", {
          p_auth_user_id: user.id,
        });

        if (rpcError) throw rpcError;

        const customer = Array.isArray(data) ? data[0] : null;

        if (!customer) {
          setSummary(null);
          return;
        }

        setSummary({
          customer_id: customer.customer_id,
          loyalty_points: customer.loyalty_points ?? 0,
          orders_count: customer.orders_count ?? 0,
          total_spent: Number(customer.total_spent ?? 0),
          last_order_at: customer.last_order_at ?? null,
        });
      } catch (fetchError) {
        console.error("Error fetching customer points:", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : t("errors.generic"));
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [authLoading, user]);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.loading")}>
        <div className="h-28 rounded-2xl bg-muted/10 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-borderc bg-muted/10 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-borderc bg-gradient-to-r from-primary to-primary/80 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">{t("customer.points")}</h1>
        <p className="mt-2 max-w-2xl text-white/90">{pageCopy.subtitle}</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!summary ? (
        <div className="rounded-3xl border border-borderc bg-card p-8 text-center shadow-sm">
          <p className="text-muted">{pageCopy.empty}</p>
          <Link
            href="/browse"
            className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {pageCopy.keepShopping}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-borderc bg-card p-6 shadow-sm">
              <p className="text-sm text-muted">{pageCopy.balance}</p>
              <p className="mt-3 text-4xl font-bold text-primary">{summary.loyalty_points}</p>
            </div>
            <div className="rounded-2xl border border-borderc bg-card p-6 shadow-sm">
              <p className="text-sm text-muted">{pageCopy.deliveredOrders}</p>
              <p className="mt-3 text-4xl font-bold text-foreground">{summary.orders_count}</p>
            </div>
            <div className="rounded-2xl border border-borderc bg-card p-6 shadow-sm">
              <p className="text-sm text-muted">{pageCopy.totalSpent}</p>
              <p className="mt-3 text-4xl font-bold text-foreground">
                {summary.total_spent.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-muted">MZN</p>
            </div>
          </div>

          <div className="rounded-3xl border border-borderc bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">
              {pageCopy.howItWorksTitle}
            </h2>
            <p className="mt-3 max-w-3xl text-muted">{pageCopy.howItWorksBody}</p>
            <Link
              href="/browse"
              className="mt-6 inline-flex rounded-xl border border-borderc px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/10"
            >
              {pageCopy.keepShopping}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
