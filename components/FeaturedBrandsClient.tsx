"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Brand = { id: string; name: string; slug: string; logo_path?: string | null };

export default function FeaturedBrandsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Brand[] | null>(null);

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

  if (!data || data.length === 0) {
    return (
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <h2 className="text-lg font-semibold">Featured brands</h2>
          <div className="mt-4 rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">No data — select featured brands in Admin → Site.</h3>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      <div className="container max-w-[1200px]">
        <h2 className="text-lg font-semibold">Featured brands</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data.map((b) => (
            <Link key={b.id} href={`/b/${b.slug}`} className="rounded-xl bg-card p-4 border border-borderc flex flex-col items-center gap-2 hover:shadow-pop">
              {b.logo_path ? (
                <img src={b.logo_path} alt={b.name} className="h-16 object-contain" />
              ) : (
                <div className="h-16 w-full flex items-center justify-center text-sm text-muted">No logo</div>
              )}
              <div className="text-sm font-medium text-center">{b.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
