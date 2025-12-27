"use client";
import { useEffect } from "react";

export default function PageAnalytics({ path = '/' }: { path?: string }) {
  useEffect(() => {
    let mounted = true
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'page_view', path })
    }).catch(() => {})
    return () => { mounted = false }
  }, [path])

  return null
}
