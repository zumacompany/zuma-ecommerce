import { z } from 'zod'

export const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category_id: z.string().uuid('Invalid category_id'),
  logo_path: z.string().optional().nullable(),
  hero_image_path: z.string().optional().nullable(),
  description_md: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
})

export const UpdateBrandSchema = CreateBrandSchema.partial()

export type CreateBrandInput = z.output<typeof CreateBrandSchema>
export type UpdateBrandInput = z.output<typeof UpdateBrandSchema>
