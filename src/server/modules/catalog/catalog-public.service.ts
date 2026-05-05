import 'server-only'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const PUBLIC_OFFER_SELECT =
  'id, brand_id, brand:brands(id, name, slug), region_code, denomination_value, denomination_currency, price, status, stock_quantity, is_unlimited, show_when_out_of_stock'

const PUBLIC_PAYMENT_METHOD_SELECT = 'id, name, type, instructions_md, details'

const PUBLIC_BRAND_SELECT = 'id, name, slug, logo_path, category_id'

const PUBLIC_CATEGORY_SELECT = 'id, name, slug'

const ACTIVE_STATUS = 'active'

export type PublicOffer = {
  id: string
  brand_id: string | null
  brand: { id: string; name: string; slug: string } | null
  region_code: string | null
  denomination_value: number | null
  denomination_currency: string | null
  price: number
  status: string
  stock_quantity: number | null
  is_unlimited: boolean | null
  show_when_out_of_stock: boolean | null
}

/**
 * Should this offer block a purchase right now?
 *
 * Out-of-stock means: not unlimited AND stock_quantity is null/zero.
 */
export function isOfferOutOfStock(
  offer: Pick<PublicOffer, 'is_unlimited' | 'stock_quantity'>,
): boolean {
  if (offer.is_unlimited) return false
  return (offer.stock_quantity ?? 0) <= 0
}

export type PublicPaymentMethod = {
  id: string
  name: string
  type: string
  instructions_md: string | null
  details: unknown
}

export type PublicBrand = {
  id: string
  name: string
  slug: string
  logo_path: string | null
  category_id: string | null
}

export type PublicCategory = {
  id: string
  name: string
  slug: string
}

/**
 * Public catalog reads. Every function here applies the publication-status
 * filter at the query layer so callers do not have to remember.
 *
 * Service-role is used because RLS on these read paths is not yet in place;
 * the boundary is enforced by what these functions select and filter.
 */

export async function getActivePublicOfferById(id: string): Promise<PublicOffer | null> {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('offers')
    .select(PUBLIC_OFFER_SELECT)
    .eq('id', id)
    .eq('status', ACTIVE_STATUS)
    .maybeSingle()

  if (error) throw new ValidationError(error.message)
  return (data as PublicOffer | null) ?? null
}

export async function listActivePublicPaymentMethods(): Promise<PublicPaymentMethod[]> {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('payment_methods')
    .select(PUBLIC_PAYMENT_METHOD_SELECT)
    .eq('status', ACTIVE_STATUS)
    .order('sort_order')

  if (error) throw new ValidationError(error.message)
  return (data ?? []) as PublicPaymentMethod[]
}

export async function listActivePublicBrands(): Promise<PublicBrand[]> {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('brands')
    .select(PUBLIC_BRAND_SELECT)
    .eq('status', ACTIVE_STATUS)
    .order('name')

  if (error) throw new ValidationError(error.message)
  return (data ?? []) as PublicBrand[]
}

export async function listActivePublicBrandsBySlug(slugs: string[]): Promise<PublicBrand[]> {
  if (slugs.length === 0) return []
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('brands')
    .select(PUBLIC_BRAND_SELECT)
    .in('slug', slugs)
    .eq('status', ACTIVE_STATUS)

  if (error) throw new ValidationError(error.message)
  return (data ?? []) as PublicBrand[]
}

export async function listPublicCategories(): Promise<PublicCategory[]> {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('categories')
    .select(PUBLIC_CATEGORY_SELECT)
    .order('name')

  if (error) throw new ValidationError(error.message)
  return (data ?? []) as PublicCategory[]
}

export async function getActivePublicBrandBySlug(slug: string): Promise<PublicBrand | null> {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('brands')
    .select(PUBLIC_BRAND_SELECT)
    .eq('slug', slug)
    .eq('status', ACTIVE_STATUS)
    .maybeSingle()

  if (error) throw new ValidationError(error.message)
  return (data as PublicBrand | null) ?? null
}

export async function listActivePublicOffersByBrandId(brandId: string): Promise<PublicOffer[]> {
  const adminClient = createSupabaseAdminClient()
  // Public catalog rule: keep an offer when it is unlimited, has stock, OR
  // the merchant flagged `show_when_out_of_stock = true`. Hide otherwise.
  const { data, error } = await adminClient
    .from('offers')
    .select(PUBLIC_OFFER_SELECT)
    .eq('brand_id', brandId)
    .eq('status', ACTIVE_STATUS)
    .or('is_unlimited.eq.true,stock_quantity.gt.0,show_when_out_of_stock.eq.true')
    .order('denomination_value', { ascending: true })

  if (error) throw new ValidationError(error.message)
  return (data ?? []) as unknown as PublicOffer[]
}

export async function getPublicCategoryBySlug(slug: string): Promise<PublicCategory | null> {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('categories')
    .select(PUBLIC_CATEGORY_SELECT)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new ValidationError(error.message)
  return (data as PublicCategory | null) ?? null
}

export async function listActivePublicBrandsByCategoryId(categoryId: string): Promise<PublicBrand[]> {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('brands')
    .select(PUBLIC_BRAND_SELECT)
    .eq('category_id', categoryId)
    .eq('status', ACTIVE_STATUS)
    .order('name')

  if (error) throw new ValidationError(error.message)
  return (data ?? []) as PublicBrand[]
}
