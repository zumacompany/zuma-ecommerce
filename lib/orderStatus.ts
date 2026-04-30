import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
} from '@/src/server/modules/orders/order-status.mapper'

// Shared utilities for rendering order status badges across customer + admin UIs.

export function getStatusColor(status: string): string {
  return getOrderStatusBadgeClass(status)
}

export function getStatusLabel(status: string, t: (key: string) => string): string {
  return getOrderStatusLabel(status, t)
}
