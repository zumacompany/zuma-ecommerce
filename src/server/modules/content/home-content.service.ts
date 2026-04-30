import 'server-only'

import { z } from 'zod'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'
import { SITE_SETTING_KEYS, mapSiteSettingsRows } from './site-settings.mapper'

const HomeContentUpdateSchema = z.object({
  hero_title: z.string().trim().nullable().optional(),
  hero_subtitle: z.string().trim().nullable().optional(),
  hero_banner_image: z.string().trim().nullable().optional(),
  featured_brands_title: z.string().trim().nullable().optional(),
  trust_points_title: z.string().trim().nullable().optional(),
  faq_title: z.string().trim().nullable().optional(),
}).partial()

const FeaturedBrandsSchema = z.object({
  slugs: z.array(z.string().trim().min(1)),
})

type HomeContentRow = {
  hero_title?: string | null
  hero_subtitle?: string | null
  hero_banner_image?: string | null
  featured_brands_title?: string | null
  trust_points_title?: string | null
  faq_title?: string | null
}

type BrandRow = {
  id: string
  name: string
  slug: string
}

export async function getHomeContent() {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient.from('home_content').select('*').eq('id', 1).maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data: (data ?? {}) as HomeContentRow }
}

export async function updateHomeContent(request: Request) {
  const body = HomeContentUpdateSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('home_content').upsert({ ...body, id: 1 })

  if (error) {
    throw new ValidationError(error.message)
  }

  return { success: true }
}

export async function getFeaturedBrandSlugs() {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('home_featured_brands')
    .select('brand_slug')
    .order('sort_order', { ascending: true })

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data: (data ?? []).map((row: { brand_slug: string }) => row.brand_slug) }
}

export async function updateFeaturedBrandSlugs(request: Request) {
  const payload = FeaturedBrandsSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()

  const { error: deleteError } = await adminClient
    .from('home_featured_brands')
    .delete()
    .neq('brand_slug', '')

  if (deleteError) {
    throw new ValidationError(deleteError.message)
  }

  if (payload.slugs.length > 0) {
    const { error: insertError } = await adminClient.from('home_featured_brands').insert(
      payload.slugs.map((slug, index) => ({
        brand_slug: slug,
        sort_order: index,
      }))
    )

    if (insertError) {
      throw new ValidationError(insertError.message)
    }
  }

  return { success: true }
}

export async function getAdminSiteSnapshot() {
  const adminClient = createSupabaseAdminClient()
  const [homeRes, trustRes, faqRes, featuredRes, brandsRes, settingsRes] = await Promise.all([
    adminClient.from('home_content').select('*').eq('id', 1).maybeSingle(),
    adminClient.from('trust_points').select('id, title, subtitle, sort_order').order('sort_order'),
    adminClient.from('faqs').select('id, question, answer, sort_order').order('sort_order'),
    adminClient
      .from('home_featured_brands')
      .select('brand_slug')
      .order('sort_order', { ascending: true }),
    adminClient.from('brands').select('id, name, slug').order('name'),
    adminClient.from('site_content').select('key, value').in('key', [...SITE_SETTING_KEYS]),
  ])

  const firstError =
    homeRes.error
    || trustRes.error
    || faqRes.error
    || featuredRes.error
    || brandsRes.error
    || settingsRes.error

  if (firstError) {
    throw new ValidationError(firstError.message)
  }

  return {
    data: {
      home: (homeRes.data ?? {}) as HomeContentRow,
      trust_points: trustRes.data ?? [],
      faqs: faqRes.data ?? [],
      featured_brand_slugs: (featuredRes.data ?? []).map((row: { brand_slug: string }) => row.brand_slug),
      brands: (brandsRes.data ?? []) as BrandRow[],
      settings: mapSiteSettingsRows((settingsRes.data ?? []) as Array<{ key: string; value: unknown }>),
    },
  }
}
