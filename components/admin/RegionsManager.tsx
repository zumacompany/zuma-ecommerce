"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, X, Check, Globe } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"

type Region = {
    id: string
    name: string
    code: string
    created_at: string
}

export default function RegionsManager({ initialRegions }: { initialRegions: Region[] }) {
    const router = useRouter()
    const [regions, setRegions] = useState(initialRegions)

    // Create state
    const [newName, setNewName] = useState("")
    const [newCode, setNewCode] = useState("")
    const [creating, setCreating] = useState(false)

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editCode, setEditCode] = useState("")
    const [updating, setUpdating] = useState(false)

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim() || !newCode.trim()) return

        setCreating(true)
        try {
            const res = await fetch('/api/admin/regions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim(), code: newCode.trim().toUpperCase() })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to create')

            // Optimistic update - add to local state
            if (json.data) {
                setRegions(prev => [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name)))
            }

            setNewName('')
            setNewCode('')
            router.refresh()
        } catch (err: any) {
            alert(`Failed to create region: ${err.message}`)
        } finally {
            setCreating(false)
        }
    }

    function startEdit(region: Region) {
        setEditingId(region.id)
        setEditName(region.name)
        setEditCode(region.code)
    }

    function cancelEdit() {
        setEditingId(null)
        setEditName('')
        setEditCode('')
    }

    async function handleUpdate() {
        if (!editingId || !editName.trim() || !editCode.trim()) return

        setUpdating(true)
        try {
            const res = await fetch(`/api/admin/regions/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim(), code: editCode.trim().toUpperCase() })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to update')

            // Optimistic update - update in local state
            if (json.data) {
                setRegions(prev => prev.map(r => r.id === editingId ? json.data : r).sort((a, b) => a.name.localeCompare(b.name)))
            }

            cancelEdit()
            router.refresh()
        } catch (err: any) {
            alert(`Failed to update region: ${err.message}`)
        } finally {
            setUpdating(false)
        }
    }

    async function handleDelete() {
        if (!deleteId) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/admin/regions/${deleteId}`, {
                method: 'DELETE'
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to delete')

            // Optimistic update - remove from local state
            setRegions(prev => prev.filter(r => r.id !== deleteId))

            setDeleteId(null)
            router.refresh()
        } catch (err: any) {
            alert(`Failed to delete region: ${err.message}`)
        } finally {
            setDeleting(false)
        }
    }

    const regionToDelete = regions.find(r => r.id === deleteId)

    return (
        <div className="space-y-6">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Region"
                description={`Are you sure you want to delete "${regionToDelete?.name}"? This action cannot be undone and may affect existing offers.`}
                confirmText="Delete Region"
                isDestructive={true}
                loading={deleting}
            />

            {/* Create Form */}
            <div className="bg-card rounded-2xl border border-borderc p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Create region</h2>
                <form onSubmit={handleCreate} className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Name (e.g., United States)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={creating}
                    />
                    <input
                        type="text"
                        placeholder="Code (e.g., US)"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        className="w-32 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        disabled={creating}
                        maxLength={3}
                    />
                    <button
                        type="submit"
                        disabled={creating || !newName.trim() || !newCode.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        {creating ? 'Creating...' : 'Create'}
                    </button>
                </form>
            </div>

            {/* Regions List */}
            <div className="bg-card rounded-2xl border border-borderc shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-borderc bg-muted/30">
                    <h2 className="text-lg font-bold">Regions</h2>
                </div>

                {regions.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title="No regions yet"
                            description="Create your first region to enable offers in different locations."
                            icon={<Globe className="w-12 h-12 text-muted/30" />}
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-borderc">
                        {regions.map((region) => (
                            <div key={region.id} className="px-6 py-4 hover:bg-muted/5 transition-colors">
                                {editingId === region.id ? (
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-borderc rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={updating}
                                            placeholder="Name"
                                        />
                                        <input
                                            type="text"
                                            value={editCode}
                                            onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                            className="w-24 px-3 py-1.5 border border-borderc rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                            disabled={updating}
                                            placeholder="CODE"
                                            maxLength={3}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdate}
                                                disabled={updating || !editName.trim() || !editCode.trim()}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Save"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                disabled={updating}
                                                className="p-2 text-muted hover:bg-muted/20 rounded-lg transition-colors"
                                                title="Cancel"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                                <Globe className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-foreground">{region.name}</div>
                                                <div className="text-sm text-muted font-mono">{region.code}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(region)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(region.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
