"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"

export default function OrderDelivery({
    orderId,
    initialCodes,
    initialNotes
}: {
    orderId: string
    initialCodes: string
    initialNotes: string
}) {
    const router = useRouter()
    const [codes, setCodes] = useState(initialCodes || "")
    const [notes, setNotes] = useState(initialNotes || "")
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    async function handleSave() {
        setSaving(true)
        try {
            const res = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    delivery_codes: codes,
                    admin_notes: notes,
                    updated_by_email: 'admin@system' // This should come from auth session ideally
                })
            })

            if (!res.ok) throw new Error('Failed to save')

            setLastSaved(new Date())
            router.refresh()
        } catch (err) {
            alert('Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const hasChanges = codes !== (initialCodes || "") || notes !== (initialNotes || "")

    return (
        <div className="rounded-xl bg-card p-6 border border-borderc shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    📦 Manual Delivery & Fulfillment
                </h3>
                {lastSaved && (
                    <span className="text-xs text-green-600 font-medium animate-pulse">
                        Saved at {lastSaved.toLocaleTimeString()}
                    </span>
                )}
            </div>

            <div className="space-y-4">
                {/* Delivery Codes */}
                <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">
                        Gift Card Codes (Customer Facing)
                    </label>
                    <div className="relative">
                        <textarea
                            value={codes}
                            onChange={(e) => setCodes(e.target.value)}
                            className="w-full px-4 py-3 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500 min-h-[100px] font-mono text-sm bg-muted/20"
                            placeholder={"Netflix: 1234-5678-9012\nSpotify: ABCD-EFGH-IJKL"}
                        />
                        <div className="absolute top-3 right-3">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">
                                Visible to Client
                            </span>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                        Paste the codes here exactly as you want the customer to see them.
                    </p>
                </div>

                {/* Admin Notes */}
                <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">
                        Internal Admin Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500 min-h-[80px] text-sm"
                        placeholder="Bought from Amazon on 29/12. Order ID #555..."
                    />
                    <p className="mt-2 text-xs text-muted">
                        Only visible to admins. Use this to track where you bought the code.
                    </p>
                </div>

                {/* Action Bar */}
                <div className="pt-4 border-t border-borderc flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={`
                            px-6 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all
                            ${hasChanges
                                ? 'bg-zuma-600 text-white hover:bg-zuma-700 shadow-md hover:shadow-lg transform active:scale-95'
                                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'}
                        `}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
