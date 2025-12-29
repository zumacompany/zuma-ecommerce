"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import ConfirmationModal from "./ConfirmationModal"

export default function CustomerActions({
    customerId,
    customerName
}: {
    customerId: string
    customerName: string
}) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/admin/customers/${customerId}`, {
                method: 'DELETE',
            })

            if (!res.ok) throw new Error('Failed to delete customer')

            router.refresh()
        } catch (err) {
            alert('Failed to delete customer')
        } finally {
            setIsDeleting(false)
            setShowConfirm(false)
        }
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <Link
                href={`/admin/customers/${customerId}`}
                className="p-1.5 text-muted hover:text-zuma-500 hover:bg-zuma-50 rounded-md transition-all"
                title="View Details"
            >
                <Eye className="w-4 h-4" />
            </Link>

            <button
                onClick={() => setShowConfirm(true)}
                className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                title="Delete Customer"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Customer"
                description={`Are you sure you want to delete ${customerName}? This will remove all their data and history.`}
                confirmText="Delete Customer"
                isDestructive={true}
                loading={isDeleting}
            />
        </div>
    )
}
