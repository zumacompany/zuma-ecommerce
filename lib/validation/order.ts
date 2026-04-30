import { z } from 'zod'

// --- Order creation (public checkout) ---

export const OrderItemSchema = z.object({
  offer_id: z.string().uuid('Invalid offer_id'),
  qty: z.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().positive('Unit price must be positive'),
})

export const CreateOrderSchema = z.object({
  // Customer info — support both legacy and new field names
  customer_name: z.string().min(1, 'Name is required').max(200),
  name: z.string().optional(), // legacy alias

  customer_email: z.string().email('Invalid email').optional().nullable(),
  email: z.string().email().optional().nullable(), // legacy alias

  customer_whatsapp: z.string().optional().nullable(),
  whatsapp_prefix: z.string().optional().nullable(),
  whatsappPrefix: z.string().optional().nullable(), // legacy alias
  whatsapp_number: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(), // legacy alias

  country: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  birthdate: z.string().optional().nullable(),

  // Payment
  payment_method_id: z.string().uuid().optional().nullable(),

  // Items
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),

  // Currency
  currency: z.string().length(3).optional().default('MZN'),

  // Analytics
  session_id: z.string().optional().nullable(),
}).transform((data) => {
  // Normalize legacy field names
  return {
    customer_name: data.customer_name || data.name || '',
    customer_email: data.customer_email || data.email || null,
    whatsapp_prefix: data.whatsapp_prefix || data.whatsappPrefix || null,
    whatsapp_number: data.whatsapp_number || data.whatsappNumber || null,
    customer_whatsapp: data.customer_whatsapp || null,
    country: data.country || null,
    province: data.province || null,
    city: data.city || null,
    birthdate: data.birthdate || null,
    payment_method_id: data.payment_method_id || null,
    items: data.items,
    currency: data.currency,
    session_id: data.session_id || null,
  }
})

export type CreateOrderInput = z.output<typeof CreateOrderSchema>

// --- Analytics ---

export const AnalyticsEventSchema = z.object({
  event_name: z.string().min(1).max(100),
  path: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  session_id: z.string().max(200).optional().nullable(),
})

export type AnalyticsEventInput = z.output<typeof AnalyticsEventSchema>
