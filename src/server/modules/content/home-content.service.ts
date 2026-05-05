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

function unwrapQuery<T>(
  label: string,
  settled: PromiseSettledResult<{ data: unknown; error: unknown }>,
  failures: string[],
): T | null {
  if (settled.status === 'rejected') {
    failures.push(`${label}: ${settled.reason instanceof Error ? settled.reason.message : 'rejected'}`)
    return null
  }
  const err = settled.value.error as { message?: string } | null
  if (err) {
    failures.push(`${label}: ${err.message ?? 'unknown'}`)
    return null
  }
  return (settled.value.data as T) ?? null
}

export async function getAdminSiteSnapshot() {
  const adminClient = createSupabaseAdminClient()
  const [homeRes, trustRes, faqRes, featuredRes, brandsRes, settingsRes] = await Promise.allSettled([
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

  const failures: string[] = []
  const home = unwrapQuery<HomeContentRow>('home_content', homeRes, failures)
  const trustPoints = unwrapQuery<unknown[]>('trust_points', trustRes, failures)
  const faqs = unwrapQuery<unknown[]>('faqs', faqRes, failures)
  const featured = unwrapQuery<{ brand_slug: string }[]>('home_featured_brands', featuredRes, failures)
  const brands = unwrapQuery<BrandRow[]>('brands', brandsRes, failures)
  const settings = unwrapQuery<{ key: string; value: unknown }[]>('site_content', settingsRes, failures)

  if (failures.length > 0) {
    console.error('[getAdminSiteSnapshot] partial load:', failures.join('; '))
  }

  return {
    data: {
      home: (home ?? {}) as HomeContentRow,
      trust_points: trustPoints ?? [],
      faqs: faqs ?? [],
      featured_brand_slugs: (featured ?? []).map((row) => row.brand_slug),
      brands: brands ?? [],
      settings: mapSiteSettingsRows(settings ?? []),
    },
    partial: failures.length > 0,
    failures,
  }
}
