"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, X, Check, Search } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"
import { useI18n } from "../../lib/i18n"

type Category = {
    id: string
    name: string
    slug: string
    color?: string
    icon?: string
    created_at: string
}

export default function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
    const { t } = useI18n()
    const router = useRouter()
    const [categories, setCategories] = useState(initialCategories)
    const [searchTerm, setSearchTerm] = useState("")

    // Sync state with props (critical for Real-time/Server Actions)
    useEffect(() => {
        setCategories(initialCategories)
    }, [initialCategories])

    useEffect(() => {
        refreshCategories()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Create state
    const [newName, setNewName] = useState("")
    const [newSlug, setNewSlug] = useState("")
    const [newColor, setNewColor] = useState("bg-gray-200")
    const [newIcon, setNewIcon] = useState("📦")
    const [creating, setCreating] = useState(false)

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editSlug, setEditSlug] = useState("")
    const [editColor, setEditColor] = useState("")
    const [editIcon, setEditIcon] = useState("")
    const [updating, setUpdating] = useState(false)

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deletingAll, setDeletingAll] = useState(false)
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)

    async function refreshCategories() {
        try {
            const res = await fetch('/api/admin/categories')
            const json = await res.json()
            if (res.ok && Array.isArray(json.data)) {
                setCategories(json.data)
            }
        } catch {
            // ignore refresh errors
        }
    }

    function slugify(value: string) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
    }

    function ensureUniqueSlug(baseSlug: string) {
        if (!baseSlug) return baseSlug
        const taken = new Set(categories.map((c) => c.slug))
        if (!taken.has(baseSlug)) return baseSlug
        let i = 2
        let candidate = `${baseSlug}-${i}`
        while (taken.has(candidate)) {
            i += 1
            candidate = `${baseSlug}-${i}`
        }
        return candidate
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim()) {
            alert(t("validation.required"))
            return
        }

        const resolvedSlug = newSlug.trim() || slugify(newName)
        if (!resolvedSlug) {
            alert(t("validation.required"))
            return
        }
        const existing = categories.find((c) => c.slug === resolvedSlug)
        if (existing && newSlug.trim()) {
            setSearchTerm(resolvedSlug)
            alert(t("categories.slugExists", { slug: resolvedSlug }))
            return
        }
        const uniqueSlug = existing ? ensureUniqueSlug(resolvedSlug) : resolvedSlug
        if (!newSlug.trim() && uniqueSlug !== resolvedSlug) {
            setNewSlug(uniqueSlug)
        }

        setCreating(true)
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    slug: uniqueSlug,
                    color: newColor,
                    icon: newIcon
                })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || t('categories.createError'))

            if (json?.data) {
                setCategories((prev) => {
                    const filtered = prev.filter((c) => c.id !== json.data.id && c.slug !== json.data.slug)
                    return [json.data, ...filtered].sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                })
            } else {
                await refreshCategories()
            }

            setNewName('')
            setNewSlug('')
            setNewColor('bg-gray-200')
            setNewIcon('📦')
            setSearchTerm('')
            router.refresh()
        } catch (err: any) {
            const msg = err?.message ?? ''
            if (msg.includes('categories_slug_key') || msg.includes('duplicate key')) {
                await refreshCategories()
                setSearchTerm(resolvedSlug)
                alert(t('categories.slugExists', { slug: resolvedSlug }))
            } else {
                alert(`${t('categories.createError')}: ${err.message}`)
            }
        } finally {
            setCreating(false)
        }
    }

    function startEdit(category: Category) {
        setEditingId(category.id)
        setEditName(category.name)
        setEditSlug(category.slug)
        setEditColor(category.color || 'bg-gray-200')
        setEditIcon(category.icon || '📦')
    }

    function cancelEdit() {
        setEditingId(null)
        setEditName('')
        setEditSlug('')
        setEditColor('')
        setEditIcon('')
    }

    async function handleUpdate() {
        if (!editingId || !editName.trim() || !editSlug.trim()) return

        setUpdating(true)
        try {
            const res = await fetch(`/api/admin/categories/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName.trim(),
                    slug: editSlug.trim(),
                    color: editColor,
                    icon: editIcon
                })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || t('categories.updateError'))

            cancelEdit()
            router.refresh()
        } catch (err: any) {
            alert(`${t('categories.updateError')}: ${err.message}`)
        } finally {
            setUpdating(false)
        }
    }

    async function handleDelete() {
        if (!deleteId) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/admin/categories/${deleteId}`, {
                method: 'DELETE'
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || t('categories.deleteError'))

            setDeleteId(null)
            router.refresh()
        } catch (err: any) {
            alert(`${t('categories.deleteError')}: ${err.message}`)
        } finally {
            setDeleting(false)
        }
    }

    async function handleDeleteAll() {
        setDeletingAll(true)
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'DELETE'
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || t('categories.deleteAllError'))

            setShowDeleteAllModal(false)
            router.refresh()
        } catch (err: any) {
            alert(`${t('categories.deleteAllError')}: ${err.message}`)
        } finally {
            setDeletingAll(false)
        }
    }

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const categoryToDelete = categories.find(c => c.id === deleteId)

    return (
        <div className="space-y-6">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title={t('categories.deleteTitle')}
                description={t('categories.deleteDescription', { name: categoryToDelete?.name || '' })}
                confirmText={t('categories.delete')}
                isDestructive={true}
                loading={deleting}
            />

            <ConfirmationModal
                isOpen={showDeleteAllModal}
                onClose={() => setShowDeleteAllModal(false)}
                onConfirm={handleDeleteAll}
                title={t('categories.deleteAllTitle')}
                description={t('categories.deleteAllDescription')}
                confirmText={t('categories.deleteAll')}
                isDestructive={true}
                loading={deletingAll}
            />

            {/* Header Actions */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowDeleteAllModal(true)}
                    disabled={categories.length === 0 || deletingAll}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    {t('categories.deleteAll')}
                </button>
            </div>

            {/* Create Form */}
            <div className="bg-card rounded-2xl border border-borderc p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">{t('categories.newCategory')}</h2>
                <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3">
                    <input
                        type="text"
                        placeholder={t('categories.name')}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                        disabled={creating}
                    />
                    <input
                        type="text"
                        placeholder={t('categories.slug')}
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        className="flex-1 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                        disabled={creating}
                    />
                    <input
                        type="text"
                        placeholder={t('categories.iconPlaceholder')}
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        className="w-40 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500 text-center"
                        disabled={creating}
                    />
                    <select
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-40 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                        disabled={creating}
                    >
                        <option value="bg-gray-200">{t('categories.colors.gray')}</option>
                        <option value="bg-[#40C4FF]">{t('categories.colors.blue')}</option>
                        <option value="bg-[#FF5252]">{t('categories.colors.red')}</option>
                        <option value="bg-[#B2EBF2]">{t('categories.colors.sky')}</option>
                        <option value="bg-orange-300">{t('categories.colors.orange')}</option>
                        <option value="bg-purple-300">{t('categories.colors.purple')}</option>
                        <option value="bg-green-300">{t('categories.colors.green')}</option>
                    </select>
                    <button
                        type="submit"
                        disabled={creating || !newName.trim() || !newSlug.trim()}
                        className="px-6 py-2 bg-zuma-500 text-white rounded-xl font-semibold hover:bg-zuma-600 transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        {t('categories.create')}
                    </button>
                </form>
            </div>

            {/* Categories List */}
            <div className="bg-card rounded-2xl border border-borderc shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-borderc bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold">{t('categories.title')}</h2>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder={t('categories.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-borderc rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zuma-500 w-full md:w-64"
                        />
                    </div>
                </div>

                {filteredCategories.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title={searchTerm ? t('categories.noResultsFound') : t('categories.noCategories')}
                            description={searchTerm ? t('categories.noResultsDescription', { query: searchTerm }) : t('categories.noCategoriesDescription')}
                            icon={<Plus className="w-12 h-12 text-muted/30" />}
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-borderc">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="px-6 py-4 hover:bg-muted/5 transition-colors">
                                {editingId === category.id ? (
                                    <div className="flex flex-col md:flex-row gap-3 items-center">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-borderc rounded-lg"
                                            disabled={updating}
                                        />
                                        <input
                                            type="text"
                                            value={editSlug}
                                            onChange={(e) => setEditSlug(e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-borderc rounded-lg"
                                            disabled={updating}
                                        />
                                        <input
                                            type="text"
                                            value={editIcon}
                                            onChange={(e) => setEditIcon(e.target.value)}
                                            className="w-16 px-3 py-1.5 border border-borderc rounded-lg text-center"
                                            disabled={updating}
                                        />
                                        <select
                                            value={editColor}
                                            onChange={(e) => setEditColor(e.target.value)}
                                            className="w-32 px-3 py-1.5 border border-borderc rounded-lg"
                                            disabled={updating}
                                        >
                                            <option value="bg-gray-200">{t('categories.colors.gray')}</option>
                                            <option value="bg-[#40C4FF]">{t('categories.colors.blue')}</option>
                                            <option value="bg-[#FF5252]">{t('categories.colors.red')}</option>
                                            <option value="bg-[#B2EBF2]">{t('categories.colors.sky')}</option>
                                            <option value="bg-orange-300">{t('categories.colors.orange')}</option>
                                            <option value="bg-purple-300">{t('categories.colors.purple')}</option>
                                            <option value="bg-green-300">{t('categories.colors.green')}</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdate}
                                                disabled={updating}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                title={t('categories.save')}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                disabled={updating}
                                                className="p-2 text-muted hover:bg-muted/20 rounded-lg"
                                                title={t('categories.cancel')}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${category.color || 'bg-gray-200'}`}>
                                                {category.icon || '📦'}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-foreground">{category.name}</div>
                                                <div className="text-sm text-muted">{category.slug}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(category)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title={t('common.edit')}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(category.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title={t('common.delete')}
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
