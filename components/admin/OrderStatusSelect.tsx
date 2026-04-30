"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "../../lib/i18n"
import { ORDER_STATUSES, type OrderStatus } from "@/src/server/modules/orders/order-status"
import { getOrderStatusBadgeClass, getOrderStatusLabel, normalizeOrderStatus } from "@/src/server/modules/orders/order-status.mapper"

const DEFAULT_STATUS: OrderStatus = 'new'

export default function OrderStatusSelect({
    orderId,
    currentStatus
}: {
    orderId: string,
    currentStatus: string
}) {
    const router = useRouter()
    const { t } = useI18n()
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<OrderStatus>(normalizeOrderStatus(currentStatus) ?? DEFAULT_STATUS)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setStatus(normalizeOrderStatus(currentStatus) ?? DEFAULT_STATUS)
    }, [currentStatus])

    const currentColor = getOrderStatusBadgeClass(status)

    async function handleChange(newStatus: OrderStatus) {
        if (newStatus === status) return

        const previousStatus = status
        setError(null)
        setLoading(true)
        try {
            setStatus(newStatus)

            const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update')
            }

            router.refresh()
        } catch (err: any) {
            console.error('❌ Status update failed:', err)
            setStatus(previousStatus)
            setError(err?.message || 'Failed to update status')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative inline-block text-left">
            <select
                value={status}
                onChange={(e) => handleChange((normalizeOrderStatus(e.target.value) ?? DEFAULT_STATUS) as OrderStatus)}
                disabled={loading}
                aria-label={t('orders.updateStatus')}
                aria-invalid={error ? true : false}
                className={`
          appearance-none
          block w-full pl-3 pr-8 py-1
          text-xs font-semibold rounded
          border-transparent focus:border-zuma-500 focus:ring-0
          cursor-pointer
          ${currentColor}
        `}
            >
                {ORDER_STATUSES.map((option) => (
                    <option key={option} value={option}>
                        {getOrderStatusLabel(option, t)}
                    </option>
                ))}
            </select>

            {/* Custom arrow if needed, but standard select is fine for MVP admin */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {loading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-zuma-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <p className="mt-1 max-w-44 text-[11px] font-medium text-danger-500">
                    {error}
                </p>
            )}
        </div>
    )
}
