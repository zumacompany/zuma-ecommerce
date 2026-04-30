"use client";

import InfoPage from "@/components/storefront/InfoPage";
import { useI18n } from "@/lib/i18n";

const copy = {
  pt: {
    eyebrow: "Privacidade",
    title: "Só recolhemos o que é necessário para vender, validar e apoiar pedidos.",
    intro:
      "Os dados usados pela Zuma servem para identificar clientes, confirmar pagamentos, gerir entregas e responder a pedidos de suporte com contexto suficiente.",
    sections: [
      {
        title: "Dados recolhidos",
        body:
          "Os formulários podem incluir nome, email, WhatsApp e dados operacionais do pedido para permitir contacto, verificação e histórico.",
      },
      {
        title: "Finalidade",
        body:
          "Usamos estes dados para criar o pedido, ligar compras à conta do cliente, acompanhar estados e melhorar a gestão operacional.",
      },
      {
        title: "Pagamentos e segurança",
        body:
          "As instruções de pagamento e os registos associados existem para verificar transferências e reduzir erros, fraude e suporte redundante.",
      },
      {
        title: "Retenção",
        body:
          "Mantemos os dados enquanto forem necessários para operação, histórico comercial e auditoria básica do serviço prestado.",
      },
    ],
    actions: [
      { href: "/cookies", label: "Ler política de cookies", tone: "secondary" as const },
      { href: "/faq", label: "Ver suporte", tone: "primary" as const },
    ],
  },
  en: {
    eyebrow: "Privacy",
    title: "We only collect what is necessary to sell, validate, and support orders.",
    intro:
      "The data used by Zuma exists to identify customers, confirm payments, manage fulfillment, and respond to support requests with enough context.",
    sections: [
      {
        title: "Data collected",
        body:
          "Forms may include name, email, WhatsApp, and operational order data so we can contact customers, verify activity, and keep a usable order history.",
      },
      {
        title: "Purpose",
        body:
          "We use this data to create orders, link purchases to customer accounts, track statuses, and improve operational management.",
      },
      {
        title: "Payments and security",
        body:
          "Payment instructions and related records exist to verify transfers and reduce errors, fraud, and redundant support work.",
      },
      {
        title: "Retention",
        body:
          "We keep data while it remains necessary for operations, basic commercial history, and service auditability.",
      },
    ],
    actions: [
      { href: "/cookies", label: "Read cookie policy", tone: "secondary" as const },
      { href: "/faq", label: "View support", tone: "primary" as const },
    ],
  },
} as const;

export default function PrivacyPage() {
  const { locale } = useI18n();
  return <InfoPage {...copy[locale]} />;
}
