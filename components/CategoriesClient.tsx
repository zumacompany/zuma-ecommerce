"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  slug: string;
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
      <section className="mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-card p-6 border border-borderc">Loading...</div>
          <div className="rounded-xl bg-card p-6 border border-borderc">Loading...</div>
          <div className="rounded-xl bg-card p-6 border border-borderc">Loading...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mt-6">
        <div className="rounded-xl bg-card p-6 border border-borderc">
          <h3 className="text-lg font-semibold">Error</h3>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </section>
    )
  }

  if (!data || data.length === 0) {
    return (
      <section className="mt-6">
        <div className="rounded-xl bg-card p-6 border border-borderc">
          <h3 className="text-lg font-semibold">No data — create categories in Admin.</h3>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data.map((c) => (
          <Link key={c.id} href={`/c/${c.slug}`} className="rounded-xl bg-card p-6 border border-borderc hover:shadow-pop">
            <h4 className="text-lg font-semibold">{c.name}</h4>
          </Link>
        ))}
      </div>
    </section>
  )
}
