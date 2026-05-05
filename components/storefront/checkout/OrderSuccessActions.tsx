"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const MIN_WHATSAPP_DIGITS = 8;

function sanitizePhone(n: string) {
  return n.replace(/[^0-9]/g, "");
}

function isValidWhatsappTarget(n: string | null | undefined): n is string {
  if (!n) return false;
  const digits = sanitizePhone(n);
  return digits.length >= MIN_WHATSAPP_DIGITS;
}

function getLocaleTag(locale: string) {
  return locale === "pt" ? "pt-MZ" : "en-US";
}

function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    style: "currency",
    currency,
  }).format(amount);
}

export default function OrderSuccessActions({
  accessToken,
  whatsappNumber,
  order,
  items,
}: {
  accessToken: string;
  whatsappNumber: string;
  order: any;
  items: any[];
}) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onHandoff() {
    setLoading(true);
    setError(null);
    try {
      if (!isValidWhatsappTarget(whatsappNumber)) {
        throw new Error(t("checkout.errors.whatsappNotConfigured"));
      }
      const phone = sanitizePhone(whatsappNumber);

      const lines = [
        `*${t("checkout.orderNumber")}* ${order.order_number}`,
        `${t("common.total")}: ${formatMoney(Number(order.total_amount ?? 0), order.currency, locale)}`,
        `${t("checkout.customerData")}: ${order.customer_name} - ${order.customer_whatsapp}`,
        "",
        `*${t("checkout.orderSummary")}*`,
        ...items.map((item: any) => {
          const brand = item?.offer?.brand?.name ?? "—";
          const region = item?.offer?.region_code ?? "—";
          const denomination =
            `${item?.offer?.denomination_currency ?? ""} ${item?.offer?.denomination_value ?? ""}`.trim();
          const lineTotal =
            Number(item?.unit_price ?? 0) * Number(item?.qty ?? 0);
          return `- ${brand} (${region}) ${denomination} x${item.qty} - ${formatMoney(lineTotal, order.currency, locale)}`;
        }),
        "",
        `*${t("checkout.paymentMethod")}* ${order.payment_method_snapshot?.name ?? "N/A"}`,
        `_${t("checkout.whatsapp.waitingConfirmation")}_`,
      ];

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (!popup) throw new Error(t("checkout.errors.whatsappPopupBlocked"));

      const res = await fetch(
        `/api/orders/${encodeURIComponent(accessToken)}/handoff`,
        { method: "POST" },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
    } catch (err: any) {
      setError(err?.message ?? "unknown");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-green-600 text-white`}
        onClick={onHandoff}
        disabled={loading}
      >
        {t("checkout.continueWhatsApp")}
      </button>
      {error && <div className="mt-2 text-sm text-danger-500">{error}</div>}
    </div>
  );
}
