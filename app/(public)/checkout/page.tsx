import { supabaseAdmin } from "../../../lib/supabase/server";
import CheckoutClient from "../../../components/storefront/checkout/CheckoutClient";
import { CheckoutHeader } from "../../../components/storefront/checkout/CheckoutHeader";
import CheckoutShell from "../../../components/storefront/checkout/CheckoutShell";
import Link from "next/link";

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

  const { data: offer, error: offerErr } = await supabaseAdmin
    .from("offers")
    .select("*, brand:brands(id, name, slug)")
    .eq("id", offerId)
    .maybeSingle();

  if (offerErr) {
    return (
      <CheckoutMessage
        tone="error"
        title="Não foi possível carregar a oferta"
        body={offerErr.message}
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

  const { data: paymentMethods, error: pmErr } = await supabaseAdmin
    .from("payment_methods")
    .select("id, name, type, instructions_md, details")
    .eq("status", "active")
    .order("sort_order");

  if (pmErr) {
    return (
      <CheckoutMessage
        tone="error"
        title="Erro a carregar métodos de pagamento"
        body={pmErr.message}
      />
    );
  }

  return (
    <CheckoutShell header={<CheckoutHeader />}>
      <CheckoutClient
        offer={offer}
        qty={qty}
        paymentMethods={paymentMethods ?? []}
      />
    </CheckoutShell>
  );
}
