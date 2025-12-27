"use client";
import { useEffect, useState } from "react";

type Faq = { question: string; answer: string };

export default function FaqClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Faq[] | null>(null);
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
          setData(Array.isArray(json.data?.faqs) ? json.data.faqs : [])
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
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <h2 className="text-lg font-semibold">FAQ</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-card p-4 border border-borderc animate-pulse h-12" />
            <div className="rounded-xl bg-card p-4 border border-borderc animate-pulse h-12" />
            <div className="rounded-xl bg-card p-4 border border-borderc animate-pulse h-12" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <h2 className="text-lg font-semibold">FAQ</h2>
          <div className="mt-4 rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">Error</h3>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!data || data.length === 0) {
    return (
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <h2 className="text-lg font-semibold">FAQ</h2>
          <div className="mt-4 rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">No data — add FAQ in Admin → Site.</h3>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      <div className="container max-w-[1200px]">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <div className="mt-4 space-y-3">
          {data.slice(0, 6).map((f, i) => (
            <div key={i} className="rounded-xl bg-card border border-borderc">
              <button
                className="w-full text-left p-4 flex items-center justify-between"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <div className="font-medium">{f.question}</div>
                <div className="text-sm text-muted">{openIndex === i ? '-' : '+'}</div>
              </button>
              {openIndex === i && (
                <div className="p-4 pt-0 text-sm text-muted">{f.answer}</div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-right">
          <a href="/faq" className="text-sm text-muted">View all FAQs</a>
        </div>
      </div>
    </section>
  )
}
