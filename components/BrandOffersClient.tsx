"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { input } from "./ui/classes";
import { useI18n } from "../lib/i18n";
import CheckoutSummary from "./storefront/checkout/CheckoutSummary";

type Offer = {
  id: string;
  region_code: string;
  denomination_value: number;
  denomination_currency: string;
  price: number;
};

export default function BrandOffersClient({
  brand,
  regions,
  initialRegion,
  initialOffers,
}: {
  brand: {
    name: string;
    logo_path: string | null;
    description_md: string | null;
    slug: string;
  };
  regions: string[];
  initialRegion: string | null;
  initialOffers: Offer[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [region, setRegion] = useState<string | null>(initialRegion);
  const [offers, setOffers] = useState<Offer[]>(initialOffers ?? []);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const selectedOffer = useMemo(
    () => offers.find((o) => o.id === selectedOfferId) ?? null,
    [offers, selectedOfferId],
  );
  const localeTag = locale === "pt" ? "pt-MZ" : "en-US";

  useEffect(() => {
    // view_brand analytics
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "view_brand",
        path: `/b/${brand.slug}`,
        metadata: { brand_slug: brand.slug },
      }),
    }).catch(() => {});
  }, [brand.slug]);

  useEffect(() => {
    // when region changes, fetch offers for it
    if (!region) return;
    setSelectedOfferId(null);
    setQty(1);
    fetch(
      `/api/offers?brand=${encodeURIComponent(brand.slug)}&region=${encodeURIComponent(region)}`,
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setOffers([]);
        } else {
          setOffers(Array.isArray(json.data) ? json.data : []);
        }
      })
      .catch(() => setOffers([]));

    // analytics: select_region
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "select_region",
        path: `/b/${brand.slug}`,
        metadata: { region_code: region, brand_slug: brand.slug },
      }),
    }).catch(() => {});
  }, [region, brand.slug]);

  function selectOffer(offerId: string) {
    setSelectedOfferId(offerId);
    // analytics: select_offer
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "select_offer",
        path: `/b/${brand.slug}`,
        metadata: { offer_id: offerId, brand_slug: brand.slug },
      }),
    }).catch(() => {});
  }

  function changeQty(delta: number) {
    setQty((q) => Math.max(1, q + delta));
  }

  function clickBuy() {
    if (!selectedOfferId || qty < 1) return;
    // analytics: click_buy
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "click_buy",
        path: `/b/${brand.slug}`,
        metadata: { offer_id: selectedOfferId, qty },
      }),
    }).catch(() => {});

    const params = new URLSearchParams({
      offerId: selectedOfferId,
      qty: String(qty),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="rounded-xl bg-card p-6 border border-borderc mb-6 flex items-start gap-4">
          {brand.logo_path ? (
            <div className="relative h-20 w-32 shrink-0">
              <Image
                src={brand.logo_path}
                alt={`${brand.name} logo`}
                fill
                sizes="128px"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-20 w-20 bg-zuma-100 flex items-center justify-center text-sm text-muted rounded-lg">
              {t("website.noLogo")}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{brand.name}</h1>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 border border-borderc mb-6">
          <h3 className="text-lg font-semibold">{t("website.howItWorks")}</h3>
          {brand.description_md ? (
            <div className="mt-3 text-sm text-muted whitespace-pre-wrap leading-relaxed">
              {brand.description_md}
            </div>
          ) : (
            <div className="mt-3 text-sm text-muted">
              {t("website.noData")} — adicione a descrição da marca no Admin.
            </div>
          )}
        </div>

        <div className="rounded-xl bg-card p-6 border border-borderc mb-6">
          <label className="text-sm font-medium">{t("website.region")}</label>
          {!regions || regions.length === 0 ? (
            <div className="mt-2 text-sm text-muted">
              {t("website.noRegions")}
            </div>
          ) : (
            <select
              value={region ?? ""}
              onChange={(e) => setRegion(e.target.value)}
              className={`mt-2 w-full ${input}`}
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          {!offers || offers.length === 0 ? (
            <div className="rounded-xl bg-card p-6 border border-borderc">
              {t("website.noOffers")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {offers.map((o) => (
                <div
                  key={o.id}
                  onClick={() => selectOffer(o.id)}
                  className={`rounded-xl p-4 border cursor-pointer transition-all ${selectedOfferId === o.id ? "border-zuma-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5)] bg-zuma-50/10" : "border-borderc bg-card hover:border-zuma-200"}`}
                >
                  <div className="text-sm text-muted font-medium uppercase tracking-wide">
                    {o.denomination_currency}
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {o.denomination_value}
                  </div>
                  <div className="mt-2 text-sm text-zuma-600 font-medium">
                    {t("website.price")}:{" "}
                    {o.price.toLocaleString(localeTag, {
                      style: "currency",
                      currency: "MZN",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="lg:col-span-1">
        {selectedOffer ? (
          <CheckoutSummary
            brandName={brand.name}
            detail={[
              selectedOffer.region_code,
              `${selectedOffer.denomination_currency} ${selectedOffer.denomination_value}`,
            ]
              .filter(Boolean)
              .join(" • ")}
            unitPriceLabel={selectedOffer.price.toLocaleString(localeTag, {
              style: "currency",
              currency: "MZN",
            })}
            quantity={qty}
            totalLabel={(qty * selectedOffer.price).toLocaleString(localeTag, {
              style: "currency",
              currency: "MZN",
            })}
            actionLabel={t("checkout.goToPayment")}
            onAction={clickBuy}
            onDecrease={() => changeQty(-1)}
            onIncrease={() => changeQty(1)}
          />
        ) : (
          <div className="sticky top-24 rounded-xl border border-borderc bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">
              {t("checkout.orderSummary")}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {t("website.selectOption")}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
