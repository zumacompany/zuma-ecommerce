"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FaqClient from "@/components/FaqClient";
import { useI18n } from "@/lib/i18n";

type FaqItem = {
  question: string;
  answer: string;
};

type SiteFaqData = {
  faq_title?: string | null;
  faqs: FaqItem[];
};

const copy = {
  pt: {
    empty: "Ainda não há perguntas frequentes publicadas.",
    hint: "Use o catálogo ou volte mais tarde enquanto a equipa termina o conteúdo de suporte.",
    browse: "Explorar catálogo",
  },
  en: {
    empty: "There are no published FAQs yet.",
    hint: "Use the catalog or check back later while the team finishes the support content.",
    browse: "Browse catalog",
  },
} as const;

export default function FaqPage() {
  const { locale, t } = useI18n();
  const [data, setData] = useState<SiteFaqData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch("/api/site-content");
        const json = await response.json();

        if (!json.data) {
          setData(null);
          return;
        }

        setData({
          faq_title: json.data.faq_title ?? null,
          faqs: Array.isArray(json.data.faqs) ? json.data.faqs : [],
        });
      } catch (error) {
        console.error("Error fetching public FAQs:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  if (loading) {
    return (
      <main className="py-12 md:py-16">
        <div className="container max-w-4xl px-4" aria-busy="true" aria-label={t("common.loading")}>
          <div className="h-20 rounded-2xl bg-muted/10 animate-pulse" />
          <div className="mt-6 space-y-4">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-24 rounded-2xl bg-muted/10 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!data || data.faqs.length === 0) {
    return (
      <main className="py-12 md:py-16">
        <div className="container max-w-3xl px-4">
          <div className="rounded-3xl border border-borderc bg-card p-8 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-foreground">{copy[locale].empty}</h1>
            <p className="mt-3 text-muted">{copy[locale].hint}</p>
            <Link
              href="/browse"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {copy[locale].browse}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <FaqClient data={data} limit={null} />;
}
