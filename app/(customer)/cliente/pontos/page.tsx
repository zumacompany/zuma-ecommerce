"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/browser";

type CustomerLoyalty = {
  customer_id: string;
  loyalty_points: number;
  orders_count: number;
};

export default function CustomerPointsPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();

  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error: rpcError } = await supabase.rpc(
        "get_customer_by_auth_user",
        { p_auth_user_id: user.id }
      );

      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (row) {
        setLoyalty({
          customer_id: row.customer_id,
          loyalty_points: Number(row.loyalty_points ?? 0),
          orders_count: Number(row.orders_count ?? 0),
        });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.loading")}>
        <div className="h-24 rounded-xl bg-muted/10 animate-pulse" />
        <div className="h-48 rounded-xl bg-muted/10 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <p className="text-sm text-danger-500">{error}</p>
      </div>
    );
  }

  const points = loyalty?.loyalty_points ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h1 className="text-2xl font-bold mb-1">{t("customer.points")}</h1>
        <p className="text-muted text-sm">{t("customer.pointsSubtitle")}</p>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-wide text-white/80">
              {t("customer.pointsBalance")}
            </div>
            <div className="mt-1 text-5xl font-bold">{points}</div>
          </div>
          <div className="text-6xl">🎁</div>
        </div>
      </div>

      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h2 className="text-lg font-semibold mb-2">{t("customer.pointsHowToEarnTitle")}</h2>
        <p className="text-sm text-muted">{t("customer.pointsHowToEarnBody")}</p>
      </div>

      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h2 className="text-lg font-semibold mb-2">{t("customer.recentOrders")}</h2>
        <p className="text-sm text-muted">{t("customer.pointsHistoryEmpty")}</p>
      </div>
    </div>
  );
}
