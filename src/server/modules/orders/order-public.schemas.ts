import { z } from 'zod'

export const PUBLIC_ORDER_ACCESS_TOKEN_VERSION = 1 as const
export const PUBLIC_ORDER_ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30

export const PublicOrderAccessTokenPayloadSchema = z.object({
  v: z.literal(PUBLIC_ORDER_ACCESS_TOKEN_VERSION),
  orderId: z.string().uuid(),
  exp: z.number().int().positive(),
})

export type PublicOrderAccessTokenPayload = z.infer<typeof PublicOrderAccessTokenPayloadSchema>
