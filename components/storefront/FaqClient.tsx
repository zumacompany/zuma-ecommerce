"use client";
import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "../../lib/i18n";

type Faq = { question: string; answer: string };
type SiteData = { faqs: Faq[]; faq_title?: string | null };

export default function FaqClient({
  data,
  limit = 6,
}: {
  data: SiteData | null;
  limit?: number | null;
}) {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = limit == null ? data?.faqs ?? [] : (data?.faqs ?? []).slice(0, limit);

  if (!data || items.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-16 bg-gradient-to-br from-primary/5 via-bg to-bg">
      <div className="container max-w-[900px] px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 mb-3 md:mb-4">
            <HelpCircle className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{data.faq_title || t('website.faqsTitle')}</h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 md:space-y-4">
          {items.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl bg-card border border-borderc shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <button
                className="w-full text-left p-6 flex items-start justify-between gap-4 group"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                    {f.question}
                  </h3>
                </div>
                <div className="shrink-0 mt-1">
                  {openIndex === i ? (
                    <ChevronUp className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                  )}
                </div>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="text-muted leading-relaxed border-t border-borderc pt-4">
                    {f.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
