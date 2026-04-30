"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUp, ArrowDown, ArrowUpDown, Trash2, Loader2 } from "lucide-react"
import OrderStatusSelect from "./OrderStatusSelect"
import OrderActions from "./OrderActions"
import ConfirmationModal from "./ConfirmationModal"
import { useI18n } from "../../lib/i18n"
import { table, th, td, trHover } from "../ui/classes"

type Order = {
    id: string
    order_number: string
    customer_name: string
    customer_email: string
    customer_whatsapp: string
    status: string
    total_amount: number
    currency: string
    created_at: string
    customer: {
        id: string
        name: string
        email: string
        whatsapp_e164: string
    } | null
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t, locale } = useI18n()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [deleting, setDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const sort = searchParams.get('sort') || 'created_at'
    const dir = searchParams.get('dir') || 'desc'
    const query = searchParams.get('q') || ''
    const page = searchParams.get('page') || '1'

    // Toggle selection
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    // Select All
    const toggleSelectAll = () => {
        if (selectedIds.size === orders.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(orders.map(o => o.id)))
        }
    }

    // Open Confirm
    const handleBulkDeleteClick = () => {
        if (selectedIds.size === 0) return
        setShowConfirm(true)
    }

    // Execute Delete
    const executeBulkDelete = async () => {
        setDeleting(true)
        setErrorMessage(null)
        try {
            const res = await fetch('/api/admin/orders/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            })

            if (!res.ok) throw new Error('Failed to delete')

            setSelectedIds(new Set()) // Clear selection
            setShowConfirm(false)
            router.refresh()
        } catch (err) {
            setErrorMessage(t('orders.bulk.deleteError'))
        } finally {
            setDeleting(false)
        }
    }

    // Helper for sort links
    const createSortLink = (col: string) => {
        const isCurrent = sort === col
        const newDir = isCurrent && dir === 'asc' ? 'desc' : 'asc'
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (Number(page) > 1) params.set('page', page)
        params.set('sort', col)
        params.set('dir', newDir)
        return `?${params.toString()}`
    }

    const SortIcon = ({ col }: { col: string }) => {
        if (sort !== col) return <ArrowUpDown className="ml-1 w-3 h-3 text-muted/30" />
        return dir === 'asc' ? <ArrowUp className="ml-1 w-3 h-3 text-zuma-500" /> : <ArrowDown className="ml-1 w-3 h-3 text-zuma-500" />
    }

    return (
        <div>
            {errorMessage && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {errorMessage}
                </div>
            )}

            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={executeBulkDelete}
                title={t('orders.bulk.confirmTitle')}
                description={t('orders.bulk.confirmDescription', { count: selectedIds.size })}
                confirmText={t('orders.bulk.deleteSelected')}
                isDestructive={true}
                loading={deleting}
            />

            {selectedIds.size > 0 && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                    <span className="text-sm font-semibold text-red-700">
                        {t('orders.bulk.selected', { count: selectedIds.size })}
                    </span>
                    <button
                        onClick={handleBulkDeleteClick}
                        disabled={deleting}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                        {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        {t('orders.bulk.deleteSelected')}
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className={table}>
                    <thead>
                        <tr>
                            <th className={`${th} w-[40px]`}>
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-zuma-600 focus:ring-zuma-500 cursor-pointer"
                                    checked={orders.length > 0 && selectedIds.size === orders.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className={th}>
                                <Link href={createSortLink('order_number')} className="group inline-flex items-center hover:text-foreground">
                                    {t('orders.table.order')} <SortIcon col="order_number" />
                                </Link>
                            </th>
                            <th className={th}>
                                <Link href={createSortLink('customer_name')} className="group inline-flex items-center hover:text-foreground">
                                    {t('orders.table.customer')} <SortIcon col="customer_name" />
                                </Link>
                            </th>
                            <th className={th}>
                                <Link href={createSortLink('total_amount')} className="group inline-flex items-center hover:text-foreground">
                                    {t('orders.table.total')} <SortIcon col="total_amount" />
                                </Link>
                            </th>
                            <th className={th}>
                                <Link href={createSortLink('status')} className="group inline-flex items-center hover:text-foreground">
                                    {t('orders.table.status')} <SortIcon col="status" />
                                </Link>
                            </th>
                            <th className={th}>
                                <Link href={createSortLink('created_at')} className="group inline-flex items-center hover:text-foreground">
                                    {t('orders.table.when')} <SortIcon col="created_at" />
                                </Link>
                            </th>
                            <th className={`${th} text-right`}>{t('orders.table.action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borderc">
                        {orders.map((o) => (
                            <tr key={o.id} className={`${trHover} ${selectedIds.has(o.id) ? "bg-zuma-50/60" : ""}`}>
                                <td className={td}>
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-zuma-600 focus:ring-zuma-500 cursor-pointer"
                                        checked={selectedIds.has(o.id)}
                                        onChange={() => toggleSelect(o.id)}
                                    />
                                </td>
                                <td className={`${td} font-medium`}>{o.order_number}</td>
                                <td className={td}>
                                    {o.customer ? (
                                        <>
                                            <a className="text-sm font-medium hover:text-zuma-500 transition-colors" href={`/admin/customers/${o.customer.id}`}>{o.customer.name}</a>
                                            <div className="text-xs text-muted truncate max-w-[200px]">{o.customer.email ?? ''} • {o.customer.whatsapp_e164 ?? ''}</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-sm font-medium">{o.customer_name}</div>
                                            <div className="text-xs text-muted truncate max-w-[200px]">{o.customer_email ?? ''} • {o.customer_whatsapp ?? ''}</div>
                                        </>
                                    )}
                                </td>
                                <td className={`${td} font-medium`}>{o.total_amount} {o.currency}</td>
                                <td className={td}>
                                    <OrderStatusSelect orderId={o.id} currentStatus={o.status} />
                                </td>
                                <td className={`${td} text-muted`}>{new Date(o.created_at).toLocaleString(locale === 'pt' ? 'pt-MZ' : 'en-US')}</td>
                                <td className={`${td} text-right`}>
                                    <OrderActions orderId={o.id} orderNumber={o.order_number} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
