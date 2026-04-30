import 'server-only'

import { ValidationError } from '@/src/server/http/errors'
import { createSupabasePublicClient } from '@/src/server/platform/db/supabase'
import { mapSiteSettingsRows } from './site-settings.mapper'

type HomeRow = {
  hero_title?: string | null
  hero_subtitle?: string | null
  hero_banner_image?: string | null
  featured_brands_title?: string | null
  trust_points_title?: string | null
  faq_title?: string | null
  whatsapp_number?: string | null
}

type SiteContentRow = {
  key: string
  value: unknown
}

export async function getPublicSiteContent() {
  try {
    const publicClient = createSupabasePublicClient()

    const [homeRes, trustRes, faqRes, brandsRes, settingsRes] = await Promise.all([
      publicClient.from('home_content').select('*').eq('id', 1).maybeSingle(),
      publicClient.from('trust_points').select('id, title, subtitle').order('sort_order'),
      publicClient.from('faqs').select('id, question, answer').order('sort_order'),
      publicClient.from('home_featured_brands').select('brand_slug'),
      publicClient
        .from('site_content')
        .select('key, value')
        .in('key', ['whatsapp_number', 'language']),
    ])

    const firstError =
      homeRes.error
      || trustRes.error
      || faqRes.error
      || brandsRes.error
      || settingsRes.error

    if (firstError) {
      throw new ValidationError(firstError.message)
    }

    const home = (homeRes.data ?? {}) as HomeRow
    const settings = mapSiteSettingsRows((settingsRes.data ?? []) as SiteContentRow[])

    return {
      hero_title: home.hero_title ?? null,
      hero_subtitle: home.hero_subtitle ?? null,
      hero_banner_image: home.hero_banner_image ?? null,
      featured_brands_title: home.featured_brands_title ?? null,
      featured_brand_slugs: (brandsRes.data ?? []).map((brand: any) => brand.brand_slug),
      trust_points_title: home.trust_points_title ?? null,
      trust_points: trustRes.data ?? [],
      faq_title: home.faq_title ?? null,
      faqs: faqRes.data ?? [],
      language: settings.language,
      whatsapp_number: settings.whatsapp_number || home.whatsapp_number || null,
    }
  } catch (error) {
    console.error('Error fetching public site content:', error)
    // Return default data
    return {
      hero_title: null,
      hero_subtitle: null,
      hero_banner_image: null,
      featured_brands_title: null,
      featured_brand_slugs: [],
      trust_points_title: null,
      trust_points: [],
      faq_title: null,
      faqs: [],
      language: 'pt',
      whatsapp_number: null,
    }
  }
}

export async function getPublicWhatsappNumber() {
  const siteContent = await getPublicSiteContent()
  return siteContent.whatsapp_number
}
