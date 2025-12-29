"use client";
import { useEffect, useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

type Faq = { question: string; answer: string };
type SiteData = { faqs: Faq[]; faq_title?: string | null };

export default function FaqClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SiteData | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/site-content')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json.error) {
          setError(json.error)
          setData(null)
        } else {
          setData({
            faqs: Array.isArray(json.data?.faqs) ? json.data.faqs : [],
            faq_title: json.data?.faq_title
          })
          setError(null)
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message ?? 'unknown')
        setData(null)
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-primary/5 via-bg to-bg">
        <div className="container max-w-[900px] px-4">
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-muted/10 rounded mx-auto animate-pulse mb-4" />
            <div className="h-6 w-96 bg-muted/10 rounded mx-auto animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-card p-6 border border-borderc animate-pulse h-20" />
            <div className="rounded-2xl bg-card p-6 border border-borderc animate-pulse h-20" />
            <div className="rounded-2xl bg-card p-6 border border-borderc animate-pulse h-20" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-primary/5 via-bg to-bg">
        <div className="container max-w-[900px] px-4">
          <div className="text-center mb-8">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm">
            <h3 className="text-lg font-semibold text-red-600">Error</h3>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!data || !data.faqs || data.faqs.length === 0) {
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
          <h2 className="text-3xl font-bold tracking-tight">{data.faq_title || "Frequently Asked Questions"}</h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 md:space-y-4">
          {data.faqs.slice(0, 6).map((f, i) => (
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
