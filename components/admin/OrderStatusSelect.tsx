"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const STATUS_OPTIONS = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-amber-100 text-amber-700' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
    { value: 'canceled', label: 'Canceled', color: 'bg-red-100 text-red-700' }
]

export default function OrderStatusSelect({
    orderId,
    currentStatus
}: {
    orderId: string,
    currentStatus: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(currentStatus)

    // Find current color or default
    const currentColor = STATUS_OPTIONS.find(o => o.value === status)?.color || 'bg-gray-100 text-gray-700'

    async function handleChange(newStatus: string) {
        if (newStatus === status) return

        console.log('🔄 Attempting to update order status:', {
            orderId,
            currentStatus: status,
            newStatus
        })

        setLoading(true)
        try {
            // Optimistic update
            setStatus(newStatus)

            const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            })

            const data = await res.json()
            console.log('📡 API Response:', { status: res.status, data })

            if (!res.ok) {
                throw new Error(data.error || 'Failed to update')
            }

            console.log('✅ Status updated successfully')
            router.refresh()
        } catch (err: any) {
            // Revert on error
            console.error('❌ Status update failed:', err)
            setStatus(currentStatus)
            alert(`Failed to update status: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative inline-block text-left">
            <select
                value={status}
                onChange={(e) => handleChange(e.target.value)}
                disabled={loading}
                className={`
          appearance-none
          block w-full pl-3 pr-8 py-1
          text-xs font-semibold rounded
          border-transparent focus:border-zuma-500 focus:ring-0
          cursor-pointer
          ${currentColor}
        `}
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
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
        </div>
    )
}
