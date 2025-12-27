"use client";
import { useEffect, useState } from "react";

type TrustPoint = { title: string; subtitle?: string };

export default function TrustPointsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrustPoint[] | null>(null);

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
          setData(Array.isArray(json.data?.trust_points) ? json.data.trust_points : []);
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
          <h2 className="text-lg font-semibold">Why choose Zuma</h2>
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

  if (!data || data.length === 0) {
    return (
      <section className="mt-8">
        <div className="container max-w-[1200px]">
          <h2 className="text-lg font-semibold">Why choose Zuma</h2>
          <div className="mt-4 rounded-xl bg-card p-6 border border-borderc">
            <h3 className="text-lg font-semibold">No data — add trust points in Admin → Site.</h3>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="container max-w-[1200px]">
        <h2 className="text-lg font-semibold">Why choose Zuma</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.map((t, i) => (
            <div key={i} className="rounded-xl bg-card p-4 border border-borderc flex items-start gap-3 h-24">
              <div className="h-10 w-10 rounded-full bg-zuma-100 flex items-center justify-center text-sm text-muted">Icon</div>
              <div>
                <div className="font-medium">{t.title}</div>
                {t.subtitle && <div className="text-sm text-muted">{t.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
