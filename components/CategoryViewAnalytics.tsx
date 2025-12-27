"use client";
import { useEffect } from "react";

export default function CategoryViewAnalytics({ categorySlug }: { categorySlug: string }) {
  useEffect(() => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'view_category', path: `/c/${categorySlug}`, metadata: { category_slug: categorySlug } })
    }).catch(() => {})
  }, [categorySlug])

  return null
}
