"use client";

import { useI18n } from "@/lib/i18n";

type CheckoutSummaryProps = {
  brandName: string;
  detail: string;
  unitPriceLabel: string;
  quantity: number;
  subtotalLabel?: string | null;
  totalLabel: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionType?: "button" | "submit";
  actionForm?: string;
  onAction?: () => void;
  onDecrease?: () => void;
  onIncrease?: () => void;
  error?: string | null;
  footerNote?: string | null;
  sticky?: boolean;
};

export default function CheckoutSummary({
  brandName,
  detail,
  unitPriceLabel,
  quantity,
  subtotalLabel,
  totalLabel,
  actionLabel,
  actionDisabled = false,
  actionType = "button",
  actionForm,
  onAction,
  onDecrease,
  onIncrease,
  error,
  footerNote,
  sticky = true,
}: CheckoutSummaryProps) {
  const { t } = useI18n();
  const showQuantityControls = Boolean(onDecrease && onIncrease);
  const wrapperClass = sticky ? "sticky top-24" : "";
  const hasSubtotal = Boolean(subtotalLabel);

  return (
    <div className={wrapperClass}>
      <section className="rounded-2xl border border-borderc bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">{t("checkout.orderSummary")}</h3>

        <div className="mt-5 flex items-start gap-4 border-b border-borderc pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {brandName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{brandName}</div>
            <div className="mt-1 text-xs text-muted">{detail}</div>
          </div>
          <div className="text-sm font-semibold text-foreground">{unitPriceLabel}</div>
        </div>

        <div className="border-b border-borderc py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{t("checkout.quantity")}</span>
            {showQuantityControls ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onDecrease}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-borderc transition hover:bg-bg"
                  aria-label={t("common.previous")}
                >
                  -
                </button>
                <span className="w-4 text-center text-sm font-medium text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={onIncrease}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-borderc transition hover:bg-bg"
                  aria-label={t("common.next")}
                >
                  +
                </button>
              </div>
            ) : (
              <span className="text-sm font-medium text-foreground">{quantity}</span>
            )}
          </div>
        </div>

        <div className="space-y-2 py-4">
          {hasSubtotal ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted">{t("checkout.subtotal")}</span>
              <span className="text-foreground">{subtotalLabel}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-bold text-foreground">
            <span>{t("checkout.totalToPay")}</span>
            <span>{totalLabel}</span>
          </div>
        </div>

        {actionLabel ? (
          <button
            type={actionType}
            form={actionForm}
            onClick={onAction}
            disabled={actionDisabled}
            className={`mt-2 w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
              actionDisabled
                ? "cursor-not-allowed bg-muted/20 text-muted shadow-none"
                : "bg-zuma-600 text-white shadow-md hover:bg-zuma-700 hover:shadow-lg"
            }`}
          >
            {actionLabel}
          </button>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-lg border border-danger-100 bg-danger-50 p-3 text-center text-sm text-danger-700">
            {error}
          </div>
        ) : null}

        {footerNote ? (
          <p className="mt-4 text-center text-xs text-muted">{footerNote}</p>
        ) : null}
      </section>
    </div>
  );
}
