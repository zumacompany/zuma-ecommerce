"use client";
import { useI18n } from "@/lib/i18n";

export function CheckoutHeader() {
  const { t } = useI18n();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t("checkout.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("checkout.subtitle")}</p>
    </>
  );
}
