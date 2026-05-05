import 'server-only'

import { supabaseAdmin } from '@/lib/supabase/server'
import { extractSiteSettingString } from '@/src/server/modules/content/site-settings.mapper'

type HomeRow = {
  hero_title?: string | null
  hero_subtitle?: string | null
  hero_banner_image?: string | null
  featured_brands_title?: string | null
  trust_points_title?: string | null
  faq_title?: string | null
  whatsapp_number?: string | null
}

type SiteSettingRow = {
  value?: unknown
}

type TrustPointRow = {
  id: string
  title: string
  subtitle?: string | null
}

type FaqRow = {
  id: string
  question: string
  answer: string
}

type FeaturedBrandSlugRow = {
  brand_slug: string
}

type CategoryRow = {
  id: string
  name: string
  slug: string
}

type BrandRow = {
  id: string
  name: string
  slug: string
  logo_path?: string | null
  category_id?: string | null
  status?: string | null
}

export async function getHomePageData() {
  try {
    const [
      homeRes,
      trustRes,
      faqRes,
      featuredSlugsRes,
      settingsRes,
      categoriesRes,
      brandsRes,
    ] = await Promise.all([
      supabaseAdmin.from('home_content').select('*').eq('id', 1).maybeSingle(),
      supabaseAdmin.from('trust_points').select('id, title, subtitle').order('sort_order'),
      supabaseAdmin.from('faqs').select('id, question, answer').order('sort_order'),
      supabaseAdmin
        .from('home_featured_brands')
        .select('brand_slug')
        .order('sort_order', { ascending: true }),
      supabaseAdmin.from('site_content').select('value').eq('key', 'whatsapp_number').maybeSingle(),
      supabaseAdmin.from('categories').select('id, name, slug').order('name'),
      supabaseAdmin
        .from('brands')
        .select('id, name, slug, logo_path, category_id, status')
        .eq('status', 'active')
        .order('name'),
    ])

    const home = (homeRes.data ?? {}) as HomeRow
    const trustPoints = ((trustRes.data ?? []) as TrustPointRow[]).map(({ id, title, subtitle }) => ({
      id,
      title,
      subtitle: subtitle ?? undefined,
    }))
    const faqs = (faqRes.data ?? []) as FaqRow[]
    const featuredBrandSlugs = ((featuredSlugsRes.data ?? []) as FeaturedBrandSlugRow[]).map(
      (row) => row.brand_slug,
    )
    const categories = (categoriesRes.data ?? []) as CategoryRow[]
    const brands = (brandsRes.data ?? []) as BrandRow[]
    const settings = (settingsRes.data ?? null) as SiteSettingRow | null

    const siteContent = {
      hero_title: home.hero_title ?? null,
      hero_subtitle: home.hero_subtitle ?? null,
      hero_banner_image: home.hero_banner_image ?? null,
      featured_brands_title: home.featured_brands_title ?? null,
      trust_points_title: home.trust_points_title ?? null,
      faq_title: home.faq_title ?? null,
      whatsapp_number: extractSiteSettingString(settings?.value, home.whatsapp_number ?? '') || null,
      trust_points: trustPoints,
      faqs,
    }

    const featuredBrands = featuredBrandSlugs
      .map((slug) => brands.find((brand) => brand.slug === slug))
      .filter((brand): brand is BrandRow => Boolean(brand))
      .map(({ id, name, slug, logo_path }) => ({
        id,
        name,
        slug,
        logo_path: logo_path ?? null,
      }))

    // Active filter is applied at the DB layer above, so this is just a shape mapper.
    const activeBrands = brands.map(({ id, name, slug, logo_path, category_id }) => ({
      id,
      name,
      slug,
      logo_path: logo_path ?? null,
      category_id: category_id ?? '',
    }))

    return {
      siteContent,
      featuredBrands: {
        title: home.featured_brands_title ?? null,
        brands: featuredBrands,
      },
      categoryRows: {
        categories,
        brands: activeBrands,
      },
    }
  } catch (error) {
    console.error('Error fetching home data:', error)
    // Return default data
    return {
      siteContent: {
        hero_title: 'Welcome to Zuma',
        hero_subtitle: 'Your gift card marketplace',
        hero_banner_image: null,
        featured_brands_title: 'Featured Brands',
        trust_points_title: 'Why Choose Us',
        faq_title: 'Frequently Asked Questions',
        whatsapp_number: null,
        trust_points: [],
        faqs: [],
      },
      featuredBrands: {
        title: null,
        brands: [],
      },
      categoryRows: {
        categories: [],
        brands: [],
      },
    }
  }
}
