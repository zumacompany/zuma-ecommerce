export const ORDER_STATUSES = [
  'new',
  'pending',
  'on_hold',
  'processing',
  'shipped',
  'delivered',
  'canceled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_ALIASES: Record<string, OrderStatus> = {
  cancelled: 'canceled',
}

export const ORDER_OPEN_STATUSES: OrderStatus[] = [
  'new',
  'pending',
  'on_hold',
  'processing',
  'shipped',
]

export const ORDER_TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'canceled']

export const ORDER_QUEUE_STATUSES: OrderStatus[] = ['new', 'pending', 'on_hold']
