"use client";

import InfoPage from "@/components/storefront/InfoPage";
import { useI18n } from "@/lib/i18n";

const copy = {
  pt: {
    eyebrow: "Política",
    title: "Reembolsos para produtos digitais exigem validação objetiva.",
    intro:
      "Como os produtos vendidos pela Zuma são digitais, cada pedido passa por confirmação do estado da entrega e do método de pagamento antes de qualquer reembolso.",
    sections: [
      {
        title: "Antes da entrega",
        body:
          "Se um pedido ainda não foi processado ou entregue, a equipa pode rever o estado e verificar se existe margem para cancelamento.",
      },
      {
        title: "Após entrega",
        body:
          "Pedidos já concluídos ou códigos já partilhados normalmente não são elegíveis para reembolso, salvo erro operacional confirmado.",
      },
      {
        title: "Pagamentos incorretos",
        body:
          "Se houve envio para o método errado, valor incorreto ou duplicação evidente, a análise deve ser aberta com comprovativo e referência do pedido.",
      },
      {
        title: "Como pedir ajuda",
        body:
          "Tenha o número do pedido, o comprovativo de pagamento e uma descrição curta do problema. Isso reduz o tempo de triagem e resposta.",
      },
    ],
    actions: [
      { href: "/faq", label: "Ler perguntas frequentes", tone: "secondary" as const },
      { href: "/browse", label: "Voltar ao catálogo", tone: "primary" as const },
    ],
  },
  en: {
    eyebrow: "Policy",
    title: "Refunds for digital products require objective validation.",
    intro:
      "Because Zuma sells digital products, every refund review depends on confirming the fulfillment state and the payment method used before any reversal is considered.",
    sections: [
      {
        title: "Before fulfillment",
        body:
          "If an order has not yet been processed or delivered, the team can review the status and check whether cancellation is still possible.",
      },
      {
        title: "After fulfillment",
        body:
          "Orders already completed or codes already shared are usually not eligible for refunds unless there is a confirmed operational error.",
      },
      {
        title: "Incorrect payments",
        body:
          "If the wrong method was used, the amount is incorrect, or there is an obvious duplicate payment, the review should be opened with proof and the order reference.",
      },
      {
        title: "How to ask for help",
        body:
          "Have your order number, payment proof, and a short description of the issue ready. That reduces triage and response time.",
      },
    ],
    actions: [
      { href: "/faq", label: "Read FAQs", tone: "secondary" as const },
      { href: "/browse", label: "Back to catalog", tone: "primary" as const },
    ],
  },
} as const;

export default function RefundsPage() {
  const { locale } = useI18n();
  return <InfoPage {...copy[locale]} />;
}
