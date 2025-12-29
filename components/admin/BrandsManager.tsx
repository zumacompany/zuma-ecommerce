"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, X, Image as ImageIcon, ChevronDown, ChevronRight } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"

type Brand = {
    id: string
    name: string
    slug: string
    category_id: string
    logo_path: string | null
    description_md: string | null
    status: 'active' | 'inactive'
    created_at: string
    category: { id: string; name: string } | null
}

type Category = {
    id: string
    name: string
}

export default function BrandsManager({
    initialBrands,
    categories
}: {
    initialBrands: Brand[]
    categories: Category[]
}) {
    const router = useRouter()
    const [brands, setBrands] = useState(initialBrands)

    // Collapsed categories state
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category_id: '',
        description_md: '',
        status: 'active' as 'active' | 'inactive'
    })
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    // Group brands by category
    const brandsByCategory = useMemo(() => {
        const grouped = new Map<string, Brand[]>()

        brands.forEach(brand => {
            const categoryId = brand.category_id
            if (!grouped.has(categoryId)) {
                grouped.set(categoryId, [])
            }
            grouped.get(categoryId)!.push(brand)
        })

        return grouped
    }, [brands])

    function toggleCategory(categoryId: string) {
        const newCollapsed = new Set(collapsedCategories)
        if (newCollapsed.has(categoryId)) {
            newCollapsed.delete(categoryId)
        } else {
            newCollapsed.add(categoryId)
        }
        setCollapsedCategories(newCollapsed)
    }

    function slugify(name: string) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    function resetForm() {
        setFormData({
            name: '',
            slug: '',
            category_id: '',
            description_md: '',
            status: 'active'
        })
        setLogoFile(null)
    }

    async function uploadFile(file: File | null) {
        if (!file) return null
        try {
            const { supabase } = await import('../../lib/supabase/browser')
            const filePath = `${Date.now()}-${file.name}`
            const { data, error } = await supabase.storage
                .from('public-assets')
                .upload(filePath, file, { cacheControl: '3600', upsert: false })

            if (error) throw error

            const { data: urlData } = supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath)

            return urlData.publicUrl
        } catch (err) {
            console.error('Upload failed:', err)
            return null
        }
    }

    async function handleCreate() {
        if (!formData.name || !formData.slug || !formData.category_id) {
            alert('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            const logoUrl = await uploadFile(logoFile)

            const res = await fetch('/api/admin/brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    logo_path: logoUrl
                })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to create')

            resetForm()
            setShowCreateModal(false)
            router.refresh()
        } catch (err: any) {
            alert(`Failed to create brand: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdate() {
        if (!editingBrand) return

        setLoading(true)
        try {
            const logoUrl = logoFile ? await uploadFile(logoFile) : undefined

            const updateData: any = { ...formData }
            if (logoUrl !== undefined) updateData.logo_path = logoUrl

            const res = await fetch(`/api/admin/brands/${editingBrand.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to update')

            resetForm()
            setShowEditModal(false)
            setEditingBrand(null)
            router.refresh()
        } catch (err: any) {
            alert(`Failed to update brand: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!deleteId) return

        setLoading(true)
        try {
            const res = await fetch(`/api/admin/brands/${deleteId}`, {
                method: 'DELETE'
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to delete')

            setDeleteId(null)
            router.refresh()
        } catch (err: any) {
            alert(`Failed to delete brand: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    function openEditModal(brand: Brand) {
        setEditingBrand(brand)
        setFormData({
            name: brand.name,
            slug: brand.slug,
            category_id: brand.category_id,
            description_md: brand.description_md || '',
            status: brand.status
        })
        setShowEditModal(true)
    }

    const brandToDelete = brands.find(b => b.id === deleteId)

    return (
        <div className="space-y-6">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Brand"
                description={`Are you sure you want to delete "${brandToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Brand"
                isDestructive={true}
                loading={loading}
            />

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card border-b border-borderc px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{showCreateModal ? 'Create Brand' : 'Edit Brand'}</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setShowEditModal(false)
                                    setEditingBrand(null)
                                    resetForm()
                                }}
                                className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value, slug: slugify(e.target.value) })
                                        }}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Apple"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Slug *</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="apple"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Category *</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Logo</label>
                                    <div className="border-2 border-dashed border-borderc rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label htmlFor="logo-upload" className="cursor-pointer">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted" />
                                            <p className="text-sm text-muted">{logoFile ? logoFile.name : 'Click to upload'}</p>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Description (Markdown)</label>
                                <textarea
                                    value={formData.description_md}
                                    onChange={(e) => setFormData({ ...formData, description_md: e.target.value })}
                                    className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Brand description in markdown format..."
                                />
                                <p className="text-xs text-muted mt-1">{formData.description_md.length} characters</p>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-card border-t border-borderc px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setShowEditModal(false)
                                    setEditingBrand(null)
                                    resetForm()
                                }}
                                className="px-4 py-2 border border-borderc rounded-xl font-semibold hover:bg-muted/20 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={showCreateModal ? handleCreate : handleUpdate}
                                disabled={loading || !formData.name || !formData.slug || !formData.category_id}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : (showCreateModal ? 'Create Brand' : 'Update Brand')}
                            </button>
                        </div>
                    </div>
                </div >
            )
            }

            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted bg-muted/30 px-3 py-1 rounded-full border border-borderc">
                    {brands.length} {brands.length === 1 ? 'Brand' : 'Brands'}
                </span>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Brand
                </button>
            </div>

            {/* Brands List Grouped by Category */}
            {
                brands.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-borderc p-12">
                        <EmptyState
                            title="No brands yet"
                            description="Create your first brand to start organizing your products."
                            icon={<Plus className="w-12 h-12 text-muted/30" />}
                            ctaLabel="Create Brand"
                            onClick={() => setShowCreateModal(true)}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categories.map(category => {
                            const categoryBrands = brandsByCategory.get(category.id) || []
                            if (categoryBrands.length === 0) return null

                            const isCollapsed = collapsedCategories.has(category.id)

                            return (
                                <div key={category.id} className="bg-card rounded-2xl border border-borderc shadow-sm overflow-hidden">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category.id)}
                                        className="w-full px-6 py-4 bg-muted/30 border-b border-borderc flex items-center justify-between hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isCollapsed ? (
                                                <ChevronRight className="w-5 h-5 text-muted" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-muted" />
                                            )}
                                            <h3 className="text-lg font-bold">{category.name}</h3>
                                            <span className="text-sm text-muted bg-muted/50 px-2 py-0.5 rounded-full">
                                                {categoryBrands.length}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Brands Table */}
                                    {!isCollapsed && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/20 border-b border-borderc">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left font-semibold">Logo</th>
                                                        <th className="px-6 py-3 text-left font-semibold">Name</th>
                                                        <th className="px-6 py-3 text-left font-semibold">Status</th>
                                                        <th className="px-6 py-3 text-right font-semibold">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-borderc">
                                                    {categoryBrands.map((brand) => (
                                                        <tr key={brand.id} className="hover:bg-muted/5 transition-colors">
                                                            <td className="px-6 py-4">
                                                                {brand.logo_path ? (
                                                                    <img src={brand.logo_path} alt={brand.name} className="h-12 w-12 object-contain rounded" />
                                                                ) : (
                                                                    <div className="h-12 w-12 bg-muted/20 rounded flex items-center justify-center">
                                                                        <ImageIcon className="w-6 h-6 text-muted/40" />
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="font-semibold text-foreground">{brand.name}</div>
                                                                <div className="text-xs text-muted">{brand.slug}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${brand.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {brand.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => openEditModal(brand)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteId(brand.id)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )
            }
        </div >
    )
}
