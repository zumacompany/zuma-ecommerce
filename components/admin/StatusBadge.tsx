import React from 'react'
import { useI18n } from '../../lib/i18n'
import { getStatusColor, getStatusLabel } from '@/lib/orderStatus'

type StatusType = 'active' | 'inactive' | string

export default function StatusBadge({ status }: { status: StatusType }) {
    const { t } = useI18n()

    if (status === 'active' || status === 'inactive') {
        const colorClass = status === 'active'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'

        return (
            <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium capitalize ${colorClass}`}>
                {t(`orders.status.${status}`)}
            </span>
        )
    }

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusLabel(status, t)}
        </span>
    )
}
