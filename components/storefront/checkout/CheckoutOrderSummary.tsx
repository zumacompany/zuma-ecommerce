"use client";
import { useI18n } from "@/lib/i18n";
import CheckoutSummary from "@/components/storefront/checkout/CheckoutSummary";

export function CheckoutOrderSummary({
  offer,
  qty,
}: {
  offer: any;
  qty: number;
}) {
  const { locale } = useI18n();
  const localeTag = locale === "pt" ? "pt-MZ" : "en-US";
  const priceLabel = new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: "MZN",
  }).format(Number(offer?.price ?? 0));
  const totalLabel = new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: "MZN",
  }).format(Number(offer?.price ?? 0) * qty);
  const denomination =
    `${offer?.denomination_currency ?? ""} ${offer?.denomination_value ?? ""}`.trim();
  const detail = [offer?.region_code, denomination].filter(Boolean).join(" • ");

  return (
    <CheckoutSummary
      brandName={offer?.brand?.name ?? "Produto"}
      detail={detail}
      unitPriceLabel={priceLabel}
      quantity={qty}
      totalLabel={totalLabel}
    />
  );
}
