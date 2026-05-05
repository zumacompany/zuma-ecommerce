import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getActivePublicBrandBySlug,
  isOfferOutOfStock,
  listActivePublicOffersByBrandId,
  type PublicOffer,
} from "@/src/server/modules/catalog/catalog-public.service";
import { APP_CONFIG } from "@/lib/config";
import OutOfStockBadge from "@/components/storefront/OutOfStockBadge";

export const revalidate = 60;

type Props = {
  params: { brandSlug: string };
};

function formatPrice(amount: number) {
  try {
    return new Intl.NumberFormat(APP_CONFIG.DEFAULT_LOCALE, {
      style: "currency",
      currency: APP_CONFIG.DEFAULT_CURRENCY,
    }).format(amount);
  } catch {
    return `${amount} ${APP_CONFIG.DEFAULT_CURRENCY}`;
  }
}

function formatDenomination(offer: PublicOffer) {
  const currency = offer.denomination_currency ?? "";
  const value = offer.denomination_value;
  if (currency && value != null) return `${currency} ${value}`;
  if (currency) return currency;
  if (value != null) return String(value);
  return "—";
}

export default async function BrandPage({ params }: Props) {
  const brand = await getActivePublicBrandBySlug(params.brandSlug);
  if (!brand) notFound();

  const offers = await listActivePublicOffersByBrandId(brand.id);

  return (
    <main className="py-10">
      <div className="container max-w-[1100px] px-4">
        <Link
          href="/browse"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-foreground mb-4"
        >
          ← Todas as marcas
        </Link>

        <header className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-6 mb-10 rounded-3xl border border-borderc bg-card p-8 shadow-sm">
          <div className="relative h-24 w-32 flex items-center justify-center shrink-0">
            {brand.logo_path ? (
              <Image
                src={brand.logo_path}
                alt={`${brand.name} logo`}
                fill
                sizes="200px"
                className="object-contain"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                {brand.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{brand.name}</h1>
            <p className="mt-2 text-sm text-muted">
              Selecione uma oferta abaixo para continuar para o checkout.
            </p>
          </div>
        </header>

        {offers.length === 0 ? (
          <div className="rounded-2xl border border-borderc bg-card p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">🛒</div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Sem ofertas disponíveis
            </h2>
            <p className="text-sm text-muted">
              Esta marca ainda não tem ofertas activas.
            </p>
          </div>
        ) : (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Ofertas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((offer) => {
                const outOfStock = isOfferOutOfStock(offer);
                return (
                  <article
                    key={offer.id}
                    className="flex flex-col gap-4 p-5 rounded-2xl border border-borderc bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted">
                          {offer.region_code ?? "—"}
                        </div>
                        <div className="mt-1 text-2xl font-bold text-foreground">
                          {formatDenomination(offer)}
                        </div>
                        {outOfStock && (
                          <div className="mt-2">
                            <OutOfStockBadge />
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase tracking-wide text-muted">
                          Preço
                        </div>
                        <div className="mt-1 text-lg font-semibold text-primary">
                          {formatPrice(offer.price)}
                        </div>
                      </div>
                    </div>
                    {outOfStock ? (
                      <button
                        type="button"
                        disabled
                        className="mt-auto inline-flex items-center justify-center rounded-xl bg-muted/30 px-4 py-2.5 text-sm font-semibold text-muted cursor-not-allowed"
                      >
                        Esgotado
                      </button>
                    ) : (
                      <Link
                        href={`/checkout?offerId=${encodeURIComponent(offer.id)}`}
                        className="mt-auto inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                      >
                        Comprar
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
