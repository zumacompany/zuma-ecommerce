"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type SiteContent = {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_banner_image?: string | null;
}

export default function HeroClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SiteContent | null>(null);

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
          setData(json.data)
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
      <section className="w-full py-16">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-8 border border-borderc">Loading...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="w-full py-16">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-8 border border-borderc">
            <h2 className="text-lg font-semibold">Error</h2>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  if (!data || (!data.hero_title && !data.hero_subtitle && !data.hero_banner_image)) {
    return (
      <section className="w-full py-16">
        <div className="container max-w-[1200px]">
          <div className="rounded-xl bg-card p-8 border border-borderc">
            <h2 className="text-2xl font-semibold">No data</h2>
            <p className="mt-2 text-sm text-muted">Add Home content in Admin → Site.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-16">
      <div className="container max-w-[1200px] grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <h1 className="text-4xl font-bold">{data.hero_title}</h1>
          {data.hero_subtitle && <p className="mt-4 text-muted">{data.hero_subtitle}</p>}

          <div className="mt-6">
            <Link href="/c/gift-cards" className="inline-flex items-center rounded-lg bg-zuma-500 text-white px-4 py-2">
              View categories
            </Link>
          </div>
        </div>

        {data.hero_banner_image ? (
          <div>
            <img src={data.hero_banner_image} alt={data.hero_title ?? 'Hero banner'} className="w-full rounded-lg object-cover" />
          </div>
        ) : null}
      </div>
    </section>
  )
}
