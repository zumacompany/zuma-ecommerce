import 'server-only'
import { recordAdminAction } from '@/lib/auditLog'
import { CreateBrandSchema, UpdateBrandSchema } from '@/lib/validation/brand'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const BRAND_SELECT = 'id, name, slug, status, logo_path, hero_image_path, description_md, category:categories(id, name)'
const BRAND_MUTATION_SELECT = 'id, name, slug, status, category:categories(id, name), logo_path, hero_image_path'

export async function listBrands() {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('brands')
    .select(BRAND_SELECT)
    .order('name')

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data: data ?? [] }
}

export async function createBrand(request: Request) {
  const payload = CreateBrandSchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()

  const { data, error } = await adminClient
    .from('brands')
    .insert(payload)
    .select(BRAND_MUTATION_SELECT)
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data }
}

export async function updateBrand(request: Request, brandId: string) {
  const payload = UpdateBrandSchema.parse(await request.json())

  if (Object.keys(payload).length === 0) {
    throw new ValidationError('nothing to update')
  }

  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('brands')
    .update(payload)
    .eq('id', brandId)
    .select(BRAND_MUTATION_SELECT)
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'brand.update',
    resource_type: 'brand',
    resource_id: brandId,
    diff: payload,
  }, request)

  return { data }
}

export async function deleteBrand(request: Request, brandId: string) {
  const adminClient = createSupabaseAdminClient()
  const { error } = await adminClient.from('brands').delete().eq('id', brandId)

  if (error) {
    throw new ValidationError(error.message)
  }

  void recordAdminAction({
    action: 'brand.delete',
    resource_type: 'brand',
    resource_id: brandId,
  }, request)

  return { data: { id: brandId } }
}
