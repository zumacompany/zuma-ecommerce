"use client";
import { useI18n } from "../lib/i18n";

type SiteContent = {
  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_banner_image?: string | null;
  whatsapp_number?: string | null;
  featured_brands_title?: string | null;
}

export default function HeroClient({ data }: { data: SiteContent | null }) {
  const { t } = useI18n();

  if (!data || (!data.hero_title && !data.hero_subtitle && !data.hero_banner_image)) {
    return null;
  }

  return (
    <section className="w-full py-4 md:py-8 border-b border-borderc bg-card">
      <div className="container max-w-[1200px] px-4">
        <div className="max-w-2xl mx-auto text-center">
          {(data.hero_title || t('website.hero.title')) && (
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {data.hero_title || t('website.hero.title')}
            </h1>
          )}

          {(data.hero_subtitle || t('website.hero.subtitle')) && (
            <p className="mt-3 text-base text-muted max-w-lg mx-auto">
              {data.hero_subtitle || t('website.hero.subtitle')}
            </p>
          )}

          {data.whatsapp_number && (
            <div className="mt-6">
              <a
                href={`https://wa.me/${data.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(t('website.whatsappSupportMessage') || "Ola tudo bem, vim pelo website e gostaria de um produto personalizado")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.938 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                {t('website.hero.cta')}
              </a>
            </div>
          )}

          {data.hero_banner_image && (
            <div className="mt-8 w-full rounded-2xl overflow-hidden border border-borderc shadow-sm">
              <img
                src={data.hero_banner_image}
                alt="Hero Banner"
                className="w-full h-auto object-cover max-h-[400px]"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
