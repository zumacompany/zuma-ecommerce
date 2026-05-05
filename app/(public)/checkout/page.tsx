import CheckoutClient from "../../../components/storefront/checkout/CheckoutClient";
import { CheckoutHeader } from "../../../components/storefront/checkout/CheckoutHeader";
import CheckoutShell from "../../../components/storefront/checkout/CheckoutShell";
import Link from "next/link";
import {
  getActivePublicOfferById,
  listActivePublicPaymentMethods,
} from "@/src/server/modules/catalog/catalog-public.service";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

function CheckoutMessage({
  title,
  body,
  tone = "info",
}: {
  title: string;
  body: string;
  tone?: "info" | "error";
}) {
  const toneClass =
    tone === "error"
      ? "bg-danger-50 border-danger-100 text-danger-700"
      : "bg-card border-borderc";
  return (
    <main className="py-12">
      <div className="container max-w-[640px] px-4">
        <div
          className={`rounded-2xl p-8 border shadow-sm text-center ${toneClass}`}
        >
          <div className="text-5xl mb-4">{tone === "error" ? "⚠️" : "🔎"}</div>
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-sm text-muted mb-6">{body}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function CheckoutPage({ searchParams }: Props) {
  const offerId =
    typeof searchParams?.offerId === "string" ? searchParams.offerId : null;
  const qty =
    typeof searchParams?.qty === "string"
      ? parseInt(searchParams.qty, 10) || 1
      : 1;

  if (!offerId) {
    return (
      <CheckoutMessage
        title="Oferta não selecionada"
        body="Escolha um produto na página inicial para continuar para o checkout."
      />
    );
  }

  let offer: Awaited<ReturnType<typeof getActivePublicOfferById>>;
  let paymentMethods: Awaited<ReturnType<typeof listActivePublicPaymentMethods>>;

  try {
    [offer, paymentMethods] = await Promise.all([
      getActivePublicOfferById(offerId),
      listActivePublicPaymentMethods(),
    ]);
  } catch (err: any) {
    return (
      <CheckoutMessage
        tone="error"
        title="Não foi possível carregar a oferta"
        body={err?.message ?? "Erro ao carregar o checkout."}
      />
    );
  }

  if (!offer) {
    return (
      <CheckoutMessage
        title="Esta oferta já não está disponível"
        body="A oferta selecionada pode ter expirado ou ter sido removida. Consulte as ofertas atuais na página inicial."
      />
    );
  }

  const checkoutOffer = {
    id: offer.id,
    region_code: offer.region_code ?? "",
    denomination_value: offer.denomination_value ?? 0,
    denomination_currency: offer.denomination_currency ?? "",
    price: offer.price,
    brand: offer.brand ?? undefined,
    stock_quantity: offer.stock_quantity,
    is_unlimited: offer.is_unlimited,
  };

  return (
    <CheckoutShell header={<CheckoutHeader />}>
      <CheckoutClient
        offer={checkoutOffer}
        qty={qty}
        paymentMethods={paymentMethods}
      />
    </CheckoutShell>
  );
}
