"use client";
import { useEffect, useState } from "react";

type TrustPoint = { title: string; subtitle?: string };
type SiteData = { trust_points: TrustPoint[]; trust_points_title?: string | null };

export default function TrustPointsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SiteData | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/site-content')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json.error) {
          setError(json.error);
          setData(null);
        } else {
          setData({
            trust_points: Array.isArray(json.data?.trust_points) ? json.data.trust_points : [],
            trust_points_title: json.data?.trust_points_title
          });
          setError(null);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message ?? 'unknown');
        setData(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-card p-4 border border-borderc animate-pulse h-24" />
            <div className="rounded-xl bg-card p-4 border border-borderc animate-pulse h-24" />
            <div className="rounded-xl bg-card p-4 border border-borderc animate-pulse h-24" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <h2 className="text-lg font-semibold">Why choose Zuma</h2>
          <div className="mt-4 rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">Error</h3>
            <p className="mt-2 text-sm text-muted">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data || !data.trust_points || data.trust_points.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-t border-borderc pt-8 bg-muted/5">
      <div className="container max-w-[1200px] px-4">
        <h2 className="text-lg font-semibold mb-4">{data.trust_points_title || "Why choose Zuma"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.trust_points.map((t, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm">{t.title}</div>
                {t.subtitle && <div className="text-xs text-muted mt-1 leading-normal">{t.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
