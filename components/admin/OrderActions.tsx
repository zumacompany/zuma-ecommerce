"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, Trash2, Loader2 } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"

export default function OrderActions({
    orderId,
    orderNumber
}: {
    orderId: string,
    orderNumber: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    async function executeDelete() {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete')
            setShowConfirm(false)
            router.refresh()
        } catch (err) {
            alert('Error deleting order')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={executeDelete}
                title="Delete Order"
                description={`Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`}
                confirmText="Delete Order"
                loading={loading}
            />

            <div className="flex items-center justify-end gap-2">
                <Link
                    href={`/admin/orders/${orderNumber}`}
                    className="p-1.5 text-muted hover:text-zuma-500 hover:bg-zuma-50 rounded-md transition-colors"
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </Link>

                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={loading}
                    className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Delete Order"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            </div>
        </>
    )
}
