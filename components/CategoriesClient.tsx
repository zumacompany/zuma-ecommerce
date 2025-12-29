"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

export default function CategoriesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Category[] | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/categories')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json.error) {
          setError(json.error)
          setData(null)
        } else {
          setData(Array.isArray(json.data) ? json.data : [])
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

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <section className="mt-8 mb-12 container max-w-[1200px] px-4">
        <h2 className="text-lg font-bold tracking-tight mb-4">Browse Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="h-40 rounded-3xl bg-muted/10 animate-pulse" />
          <div className="h-40 rounded-3xl bg-muted/10 animate-pulse" />
          <div className="h-40 rounded-3xl bg-muted/10 animate-pulse" />
        </div>
      </section>
    )
  }

  if (error || !data || data.length === 0) return null;

  // Helper fallback if Admin hasn't set colors yet
  const getFallbackStyle = (slug: string, name: string) => {
    if (slug.includes('gift') || name.toLowerCase().includes('gift')) return { bg: 'bg-[#40C4FF]', icon: '🎮' };
    if (slug.includes('stream') || name.toLowerCase().includes('stream')) return { bg: 'bg-[#FF5252]', icon: '📺' };
    if (slug.includes('coin') || slug.includes('crypto')) return { bg: 'bg-[#B2EBF2]', icon: '💵' };
    return { bg: 'bg-gray-200', icon: '📦' };
  }

  return (
    <section className="mt-8 mb-4">
      <div className="container max-w-[1200px] px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">Browse Categories</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {data.map((c) => {
            const fallback = getFallbackStyle(c.slug, c.name);
            const style = {
              bg: c.color || fallback.bg,
              icon: c.icon || fallback.icon
            };

            return (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="group flex flex-col rounded-3xl overflow-hidden shadow-sm border border-borderc hover:shadow-xl transition-all duration-300 bg-white"
              >
                {/* Top Half - Colored */}
                <div className={`${style.bg} h-24 sm:h-32 flex items-center justify-center relative`}>
                  <span className="text-5xl sm:text-6xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                    {style.icon}
                  </span>
                </div>

                {/* Bottom Half - White & Text */}
                <div className="bg-white p-4 flex items-center justify-center h-16 sm:h-20">
                  <h4 className="text-sm sm:text-lg font-medium text-center leading-tight text-gray-800">
                    {c.name}
                  </h4>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
