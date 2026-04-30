"use client";

import InfoPage from "@/components/storefront/InfoPage";
import { useI18n } from "@/lib/i18n";

const copy = {
  pt: {
    eyebrow: "Zuma",
    title: "Uma loja digital feita para entrega rápida e clara.",
    intro:
      "A Zuma reúne gift cards, vouchers e serviços digitais num fluxo simples: escolher, pagar e receber com o menor atrito possível.",
    sections: [
      {
        title: "O que vendemos",
        body:
          "Trabalhamos com marcas digitais, créditos e vouchers que precisam de informação clara e confirmação rápida antes da entrega.",
      },
      {
        title: "Como operamos",
        body:
          "A jornada foi desenhada para confirmar detalhes do pedido, alinhar o pagamento certo e encaminhar o cliente para suporte quando necessário.",
      },
      {
        title: "Suporte",
        body:
          "Quando o pedido precisa de validação extra, usamos canais diretos para fechar a operação sem deixar o cliente perdido entre páginas.",
      },
      {
        title: "Prioridade do produto",
        body:
          "O foco do Zuma é confiança operacional: catálogo organizado, estados de pedido visíveis e comunicação simples do início ao fim.",
      },
    ],
    actions: [
      { href: "/browse", label: "Explorar catálogo", tone: "primary" as const },
      { href: "/faq", label: "Ver perguntas frequentes", tone: "secondary" as const },
    ],
  },
  en: {
    eyebrow: "Zuma",
    title: "A digital store built for fast and clear fulfillment.",
    intro:
      "Zuma brings together gift cards, vouchers, and digital services in a simple flow: choose, pay, and receive with as little friction as possible.",
    sections: [
      {
        title: "What we sell",
        body:
          "We work with digital brands, credits, and vouchers that require clear information and quick confirmation before fulfillment.",
      },
      {
        title: "How we operate",
        body:
          "The journey is designed to confirm order details, align the right payment method, and route customers to support when needed.",
      },
      {
        title: "Support",
        body:
          "When an order needs extra validation, we use direct channels to close the operation without leaving the customer stuck between pages.",
      },
      {
        title: "Product priority",
        body:
          "Zuma is focused on operational trust: organized catalog data, visible order states, and straightforward communication end to end.",
      },
    ],
    actions: [
      { href: "/browse", label: "Browse catalog", tone: "primary" as const },
      { href: "/faq", label: "View FAQs", tone: "secondary" as const },
    ],
  },
} as const;

export default function AboutPage() {
  const { locale } = useI18n();
  return <InfoPage {...copy[locale]} />;
}
