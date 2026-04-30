import 'server-only'
import { z } from 'zod'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'

const CategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
})

const UpdateCategorySchema = CategorySchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'nothing to update'
)

const CATEGORY_SELECT = 'id, name, slug, color, icon, created_at'

async function ensureUncategorizedCategory() {
  const adminClient = createSupabaseAdminClient()
  const { data: uncategorized, error } = await adminClient
    .from('categories')
    .select('id')
    .eq('slug', 'sem-categoria')
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  if (uncategorized?.id) {
    return uncategorized.id
  }

  const { data: created, error: createError } = await adminClient
    .from('categories')
    .insert([
      {
        name: 'Sem categoria associada',
        slug: 'sem-categoria',
        color: 'bg-gray-200',
        icon: '📦',
      },
    ])
    .select('id')
    .single()

  if (createError || !created) {
    throw new ValidationError(createError?.message ?? 'Falha ao criar Sem categoria associada')
  }

  return created.id
}

export async function listCategories() {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('categories')
    .select(CATEGORY_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw new ValidationError(error.message)

  return { data: data ?? [] }
}

export async function createCategory(request: Request) {
  const payload = CategorySchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('categories')
    .insert([payload])
    .select(CATEGORY_SELECT)
    .single()

  if (error) throw new ValidationError(error.message)

  return { data }
}

export async function updateCategory(request: Request, categoryId: string) {
  const payload = UpdateCategorySchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('categories')
    .update(payload)
    .eq('id', categoryId)
    .select('id, name, slug, color, icon')
    .single()

  if (error) throw new ValidationError(error.message)

  return { data }
}

export async function deleteCategory(categoryId: string) {
  const adminClient = createSupabaseAdminClient()
  const uncategorizedId = await ensureUncategorizedCategory()

  if (uncategorizedId === categoryId) {
    throw new ValidationError('Não é possível apagar a categoria "Sem categoria associada".')
  }

  const { error: updateError } = await adminClient
    .from('brands')
    .update({ category_id: uncategorizedId })
    .eq('category_id', categoryId)

  if (updateError) {
    throw new ValidationError('Falha ao reatribuir marcas para Sem categoria associada')
  }

  const { error } = await adminClient.from('categories').delete().eq('id', categoryId)
  if (error) throw new ValidationError(error.message)

  return { ok: true }
}

export async function deleteAllCategories() {
  const adminClient = createSupabaseAdminClient()
  const uncategorizedId = await ensureUncategorizedCategory()

  const { error: updateError } = await adminClient
    .from('brands')
    .update({ category_id: uncategorizedId })
    .neq('category_id', uncategorizedId)

  if (updateError) throw new ValidationError(updateError.message)

  const { error } = await adminClient.from('categories').delete().neq('id', uncategorizedId)
  if (error) throw new ValidationError(error.message)

  return { ok: true }
}
