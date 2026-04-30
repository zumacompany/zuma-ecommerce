import { z } from 'zod'
import { ORDER_STATUSES } from './order-status'
import { coerceOrderStatusInput } from './order-status.mapper'

export const OrderStatusSchema = z.enum(ORDER_STATUSES)

export const OrderStatusInputSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => coerceOrderStatusInput(value))
  .pipe(OrderStatusSchema)

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusInputSchema,
})
