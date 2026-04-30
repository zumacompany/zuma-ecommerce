import {
  ORDER_OPEN_STATUSES,
  ORDER_QUEUE_STATUSES,
  ORDER_STATUSES,
  ORDER_STATUS_ALIASES,
  ORDER_TERMINAL_STATUSES,
  type OrderStatus,
} from './order-status'

const ORDER_STATUS_LABEL_KEYS: Record<OrderStatus, string> = {
  new: 'orders.status.new',
  pending: 'orders.status.pending',
  on_hold: 'orders.status.on_hold',
  processing: 'orders.status.processing',
  shipped: 'orders.status.shipped',
  delivered: 'orders.status.delivered',
  canceled: 'orders.status.canceled',
}

const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  new: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  canceled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
}

export function coerceOrderStatusInput(value: string | null | undefined): string {
  const normalized = (value ?? '').trim().toLowerCase()
  return ORDER_STATUS_ALIASES[normalized] ?? normalized
}

export function isOrderStatus(value: string | null | undefined): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus)
}

export function normalizeOrderStatus(value: string | null | undefined): OrderStatus | null {
  const normalized = coerceOrderStatusInput(value)
  return isOrderStatus(normalized) ? normalized : null
}

export function getOrderStatusLabelKey(value: string | null | undefined): string | null {
  const normalized = normalizeOrderStatus(value)
  return normalized ? ORDER_STATUS_LABEL_KEYS[normalized] : null
}

export function formatOrderStatusText(value: string | null | undefined): string {
  const normalized = normalizeOrderStatus(value) ?? coerceOrderStatusInput(value)
  if (!normalized) return 'Unknown'

  return normalized
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getOrderStatusLabel(
  value: string | null | undefined,
  t: (key: string) => string
): string {
  const key = getOrderStatusLabelKey(value)
  return key ? t(key) : formatOrderStatusText(value)
}

export function getOrderStatusBadgeClass(value: string | null | undefined): string {
  const normalized = normalizeOrderStatus(value)
  if (!normalized) {
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
  }

  return ORDER_STATUS_BADGE_CLASSES[normalized]
}

export function isOpenOrderStatus(value: string | null | undefined): boolean {
  const normalized = normalizeOrderStatus(value)
  return normalized ? ORDER_OPEN_STATUSES.includes(normalized) : false
}

export function isQueuedOrderStatus(value: string | null | undefined): boolean {
  const normalized = normalizeOrderStatus(value)
  return normalized ? ORDER_QUEUE_STATUSES.includes(normalized) : false
}

export function isTerminalOrderStatus(value: string | null | undefined): boolean {
  const normalized = normalizeOrderStatus(value)
  return normalized ? ORDER_TERMINAL_STATUSES.includes(normalized) : false
}
