import React from 'react'

type StatusType = 'active' | 'inactive' | 'pending' | 'delivered' | 'cancelled' | string

export default function StatusBadge({ status }: { status: StatusType }) {
    const s = status.toLowerCase()

    let colorClass = 'bg-muted/20 text-muted'

    if (s === 'active' || s === 'delivered') {
        colorClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    } else if (s === 'inactive' || s === 'cancelled') {
        colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    } else if (s === 'pending') {
        colorClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    }

    return (
        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${colorClass}`}>
            {status}
        </span>
    )
}
