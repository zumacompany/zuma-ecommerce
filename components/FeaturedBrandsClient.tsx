"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Brand = { id: string; name: string; slug: string; logo_path?: string | null };
type Data = { brands: Brand[]; title?: string | null };

export default function FeaturedBrandsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/featured-brands')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json.error) {
          setError(json.error)
          setData(null)
        } else {
          setData({
            brands: Array.isArray(json.data) ? json.data : [],
            title: json.title
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
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <h2 className="text-lg font-semibold">Featured brands</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl bg-card p-6 border border-borderc">Loading...</div>
            <div className="rounded-xl bg-card p-6 border border-borderc">Loading...</div>
            <div className="rounded-xl bg-card p-6 border border-borderc">Loading...</div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <h2 className="text-lg font-semibold">Featured brands</h2>
          <div className="mt-4 rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">Error</h3>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!data || !data.brands || data.brands.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 mb-12">
      <div className="container max-w-[1200px] px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{data.title || "Featured Brands"}</h2>
          <Link href="/brands" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            View all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        {/* Mobile: Horizontal Scroll, Desktop: Grid */}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:grid md:grid-cols-5 md:overflow-visible md:pb-0 md:px-0 gap-4 snap-x snap-mandatory scrollbar-hide">
          {data.brands.map((b) => (
            <Link
              key={b.id}
              href={`/b/${b.slug}`}
              className="group snap-center shrink-0 w-[160px] md:w-auto flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-borderc bg-card hover:border-primary/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[140px]"
            >
              <div className="h-16 w-full flex items-center justify-center relative">
                {b.logo_path ? (
                  <img
                    src={b.logo_path}
                    alt={b.name}
                    className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    {b.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-sm font-semibold text-center text-foreground/80 group-hover:text-primary transition-colors truncate w-full">
                {b.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
