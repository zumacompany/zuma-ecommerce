import { z } from 'zod'

export const CreateOfferSchema = z.object({
  brand_id: z.string().uuid('Invalid brand_id'),
  region_code: z.string().min(1, 'Region is required'),
  denomination_value: z.number().positive('Denomination must be positive'),
  denomination_currency: z.string().length(3, 'Currency must be 3 characters'),
  price: z.number().positive('Price must be positive'),
  cost_price: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  is_unlimited: z.boolean().optional(),
  auto_fulfill: z.boolean().optional(),
  product_id: z.string().uuid().optional().nullable(),
  show_when_out_of_stock: z.boolean().optional(),
})

export const UpdateOfferSchema = CreateOfferSchema.partial()

export type CreateOfferInput = z.output<typeof CreateOfferSchema>
export type UpdateOfferInput = z.output<typeof UpdateOfferSchema>
