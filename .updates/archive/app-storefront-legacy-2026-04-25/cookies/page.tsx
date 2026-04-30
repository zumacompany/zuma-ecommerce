"use client";

import InfoPage from "@/components/storefront/InfoPage";
import { useI18n } from "@/lib/i18n";

const copy = {
  pt: {
    eyebrow: "Cookies",
    title: "Usamos cookies e armazenamento local para manter a experiência funcional.",
    intro:
      "Alguns dados técnicos são guardados no navegador para lembrar preferências, manter a sessão e reduzir passos repetidos na navegação.",
    sections: [
      {
        title: "Sessão e autenticação",
        body:
          "Cookies de sessão ajudam a manter o acesso do cliente e do administrador entre páginas protegidas, sem exigir novo login a cada mudança.",
      },
      {
        title: "Preferências",
        body:
          "Também usamos armazenamento local para guardar tema e idioma escolhidos, evitando que a interface volte ao estado padrão.",
      },
      {
        title: "Experiência e medição",
        body:
          "Eventos técnicos e sinais de navegação podem ser registados para entender uso do site, triagem de falhas e melhoria de conversão.",
      },
      {
        title: "Controlo",
        body:
          "Pode limpar cookies e armazenamento local no seu navegador, mas algumas áreas do site poderão exigir nova autenticação ou perder preferências guardadas.",
      },
    ],
    actions: [
      { href: "/privacy", label: "Ver política de privacidade", tone: "secondary" as const },
      { href: "/browse", label: "Voltar à loja", tone: "primary" as const },
    ],
  },
  en: {
    eyebrow: "Cookies",
    title: "We use cookies and local storage to keep the experience functional.",
    intro:
      "Some technical data is stored in the browser to remember preferences, keep sessions active, and reduce repeated navigation steps.",
    sections: [
      {
        title: "Session and authentication",
        body:
          "Session cookies help keep customer and admin access active across protected pages without requiring a fresh login on every route change.",
      },
      {
        title: "Preferences",
        body:
          "We also use local storage to remember selected theme and language preferences so the interface does not fall back to defaults.",
      },
      {
        title: "Experience and measurement",
        body:
          "Technical events and navigation signals may be recorded to understand site usage, investigate failures, and improve conversion.",
      },
      {
        title: "Control",
        body:
          "You can clear cookies and local storage in your browser, but some areas may require a new login or lose saved preferences.",
      },
    ],
    actions: [
      { href: "/privacy", label: "View privacy policy", tone: "secondary" as const },
      { href: "/browse", label: "Back to store", tone: "primary" as const },
    ],
  },
} as const;

export default function CookiesPage() {
  const { locale } = useI18n();
  return <InfoPage {...copy[locale]} />;
}
