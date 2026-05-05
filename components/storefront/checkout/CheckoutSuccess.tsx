"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import OrderSuccessActions from "@/components/storefront/checkout/OrderSuccessActions";

function getLocaleTag(locale: string) {
  return locale === "pt" ? "pt-MZ" : "en-US";
}

function buildRegisterPrefill(input: {
  email?: string | null;
  whatsapp?: string | null;
  name?: string | null;
}): string | null {
  const payload: Record<string, string> = {};
  if (input.email) payload.email = input.email;
  if (input.whatsapp) payload.whatsapp = input.whatsapp;
  if (input.name) payload.name = input.name;
  if (Object.keys(payload).length === 0) return null;
  if (typeof window === "undefined") return null;
  try {
    return window.btoa(JSON.stringify(payload));
  } catch {
    return null;
  }
}

function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDenomination(
  currency?: string | null,
  value?: number | string | null,
) {
  if (!currency && value == null) return "—";
  if (!currency) return String(value ?? "");
  if (value == null) return currency;
  return `${currency} ${value}`;
}

export default function CheckoutSuccess({
  accessToken,
  whatsappNumber,
  order,
  items,
}: {
  accessToken: string;
  whatsappNumber: string | null;
  order: any;
  items: any[];
}) {
  const { t, locale } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const paymentMethodName = order.payment_method_snapshot?.name ?? "N/A";
  const firstName =
    String(order.customer_name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] ?? "Cliente";

  const showRegisterCta = !authLoading && !user;
  const registerPrefill = showRegisterCta
    ? buildRegisterPrefill({
        email: order.customer_email,
        whatsapp: order.customer_whatsapp,
        name: order.customer_name,
      })
    : null;
  const registerHref = `/cliente/login?mode=register${
    registerPrefill ? `&prefill=${encodeURIComponent(registerPrefill)}` : ""
  }`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-borderc bg-card p-8 shadow-lg">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600 dark:bg-green-900/30 dark:text-green-400">
            ✓
          </div>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            {t("checkout.success.title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("checkout.success.subtitle", { name: firstName })}
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-6 py-3 text-center">
            <div className="text-sm text-muted">
              {t("checkout.orderNumber")}
            </div>
            <div className="mt-1 text-2xl font-bold text-primary">
              {order.order_number}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-borderc bg-bg p-4">
            <div className="text-xs uppercase tracking-wide text-muted">
              {t("checkout.paymentMethod")}
            </div>
            <div className="mt-2 text-sm font-semibold text-foreground">
              {paymentMethodName}
            </div>
          </div>
          <div className="rounded-2xl border border-borderc bg-bg p-4">
            <div className="text-xs uppercase tracking-wide text-muted">
              {t("common.total")}
            </div>
            <div className="mt-2 text-sm font-semibold text-foreground">
              {formatMoney(
                Number(order.total_amount ?? 0),
                order.currency,
                locale,
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-borderc bg-bg p-4">
            <div className="text-xs uppercase tracking-wide text-muted">
              {t("checkout.customerData")}
            </div>
            <div className="mt-2 text-sm font-semibold text-foreground">
              {order.customer_name}
            </div>
            <div className="mt-1 text-xs text-muted">
              {order.customer_whatsapp}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-borderc bg-bg p-5">
          <h2 className="text-lg font-semibold text-foreground">
            {t("checkout.orderSummary")}
          </h2>
          {!items || items.length === 0 ? (
            <div className="mt-3 text-sm text-muted">{t("website.noData")}</div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item: any) => {
                const brandName = item?.offer?.brand?.name ?? "—";
                const regionCode = item?.offer?.region_code ?? "—";
                const denomination = formatDenomination(
                  item?.offer?.denomination_currency,
                  item?.offer?.denomination_value,
                );
                const lineTotal =
                  Number(item.unit_price ?? 0) * Number(item.qty ?? 0);

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-borderc bg-card p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {brandName}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {regionCode} • {denomination}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        x{item.qty}
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        {formatMoney(lineTotal, order.currency, locale)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted">
            {t("checkout.success.instructions")}
          </p>
          {whatsappNumber ? (
            <OrderSuccessActions
              accessToken={accessToken}
              whatsappNumber={whatsappNumber}
              order={order}
              items={items}
            />
          ) : (
            <div className="mt-4 rounded-xl border border-borderc bg-bg p-4 text-sm text-muted">
              {t("checkout.errors.whatsappNotConfigured")}
            </div>
          )}
        </div>

        {showRegisterCta && (
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t("customer.saveOrderTitle")}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {t("customer.saveOrderSubtitle")}
                </p>
              </div>
              <Link
                href={registerHref}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                {t("customer.createAccount")}
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center rounded-xl border border-borderc px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/10"
          >
            {t("customer.startShopping")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Zuma
          </Link>
        </div>
      </div>
    </div>
  );
}
