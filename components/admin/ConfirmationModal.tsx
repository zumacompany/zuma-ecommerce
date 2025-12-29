"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    isDestructive?: boolean
    loading?: boolean
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Delete",
    cancelText = "Cancel",
    isDestructive = true,
    loading = false,
}: ConfirmationModalProps) {
    const [show, setShow] = useState(isOpen)

    useEffect(() => {
        setShow(isOpen)
    }, [isOpen])

    if (!show) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative transform overflow-hidden rounded-lg bg-card text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-borderc">
                <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDestructive ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <AlertTriangle className={`h-6 w-6 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`} aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <h3 className="text-base font-semibold leading-6 text-foreground" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-muted">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-muted/10 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                        type="button"
                        className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-zuma-600 hover:bg-zuma-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    )
}
