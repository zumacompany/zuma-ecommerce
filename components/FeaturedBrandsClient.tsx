"use client";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "../lib/i18n";

type Brand = { id: string; name: string; slug: string; logo_path?: string | null };
type Data = { brands: Brand[]; title?: string | null };

export default function FeaturedBrandsClient({ data }: { data: Data | null }) {
  const { t } = useI18n();

  if (!data || !data.brands || data.brands.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 mb-12">
      <div className="container max-w-[1200px] px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{data.title || t('website.featuredBrands')}</h2>
          <Link href="/browse" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            {t('website.viewAll')}
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
                  <Image
                    src={b.logo_path}
                    alt={`${b.name} logo`}
                    fill
                    sizes="(max-width: 768px) 160px, 200px"
                    className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
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
