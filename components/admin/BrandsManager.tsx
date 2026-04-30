"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, X, Image as ImageIcon, ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"
import { useI18n } from "../../lib/i18n"

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
    slug: string
}

export default function BrandsManager({
    initialBrands,
    categories
}: {
    initialBrands: Brand[]
    categories: Category[]
}) {
    const { t } = useI18n()
    const router = useRouter()
    const [brands, setBrands] = useState(initialBrands)

    useEffect(() => {
        setBrands(initialBrands)
    }, [initialBrands])

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
            alert(t('validation.required'))
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
            if (!res.ok) throw new Error(json.error || t('brands.createError'))

            resetForm()
            setShowCreateModal(false)
            router.refresh()
        } catch (err: any) {
            alert(`${t('brands.createError')}: ${err.message}`)
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
            if (!res.ok) throw new Error(json.error || t('brands.updateError'))

            resetForm()
            setShowEditModal(false)
            setEditingBrand(null)
            router.refresh()
        } catch (err: any) {
            alert(`${t('brands.updateError')}: ${err.message}`)
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
            if (!res.ok) throw new Error(json.error || t('brands.deleteError'))

            setDeleteId(null)
            router.refresh()
        } catch (err: any) {
            alert(`${t('brands.deleteError')}: ${err.message}`)
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
                title={t('brands.deleteTitle')}
                description={t('brands.deleteDescription', { name: brandToDelete?.name || '' })}
                confirmText={t('brands.delete')}
                isDestructive={true}
                loading={loading}
            />

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card border-b border-borderc px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{showCreateModal ? t('brands.newBrand') : t('brands.editBrand')}</h2>
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
                                    <label className="block text-sm font-semibold mb-2">{t('brands.name')} *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value, slug: slugify(e.target.value) })
                                        }}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                                        placeholder="Apple"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">{t('brands.slug')} *</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                                        placeholder="apple"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">{t('brands.category')} *</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                                    >
                                        <option value="">{t('brands.selectCategory')}</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">{t('brands.status')}</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                                    >
                                        <option value="active">{t('brands.active')}</option>
                                        <option value="inactive">{t('brands.inactive')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">{t('brands.logo')}</label>
                                    <div className="border-2 border-dashed border-borderc rounded-xl p-4 text-center hover:border-zuma-500 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label htmlFor="logo-upload" className="cursor-pointer">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted" />
                                            <p className="text-sm text-muted">{logoFile ? logoFile.name : t('brands.clickToUpload')}</p>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">{t('brands.description')} (Markdown)</label>
                                <textarea
                                    value={formData.description_md}
                                    onChange={(e) => setFormData({ ...formData, description_md: e.target.value })}
                                    className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                                    rows={4}
                                    placeholder={t('brands.descriptionPlaceholder')}
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
                                {t('brands.cancel')}
                            </button>
                            <button
                                onClick={showCreateModal ? handleCreate : handleUpdate}
                                disabled={loading || !formData.name || !formData.slug || !formData.category_id}
                                className="px-6 py-2 bg-zuma-500 text-white rounded-xl font-semibold hover:bg-zuma-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('brands.saving') : (showCreateModal ? t('brands.create') : t('brands.save'))}
                            </button>
                        </div>
                    </div>
                </div >
            )
            }

            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted bg-muted/30 px-3 py-1 rounded-full border border-borderc">
                    {t('brands.totalCount', { count: brands.length })}
                </span>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-zuma-500 text-white rounded-xl font-semibold hover:bg-zuma-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {t('brands.newBrand')}
                </button>
            </div>

            {/* Brands List Grouped by Category */}
            {
                brands.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-borderc p-12">
                        <EmptyState
                            title={t('brands.noBrands')}
                            description={t('brands.noBrandsDescription')}
                            icon={<Plus className="w-12 h-12 text-muted/30" />}
                            ctaLabel={t('brands.newBrand')}
                            onClick={() => setShowCreateModal(true)}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {categories.map(category => {
                            const categoryBrands = brandsByCategory.get(category.id) || []

                            const isCollapsed = collapsedCategories.has(category.id)
                            const isUncategorized = category.slug === "sem-categoria"

                            return (
                                <div
                                    key={category.id}
                                    className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${isUncategorized ? "border-amber-200" : "border-borderc"
                                        }`}
                                >
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleCategory(category.id)}
                                        className={`w-full px-6 py-4 border-b flex items-center justify-between transition-colors ${isUncategorized
                                            ? "bg-amber-50 border-amber-200 hover:bg-amber-100/60"
                                            : "bg-muted/30 border-borderc hover:bg-muted/40"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isCollapsed ? (
                                                <ChevronRight className="w-5 h-5 text-muted" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-muted" />
                                            )}
                                            <h3 className="text-lg font-bold">{category.name}</h3>
                                            {isUncategorized && (
                                                <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                                    {t("brands.uncategorizedBadge")}
                                                </span>
                                            )}
                                            <span className="text-sm text-muted bg-muted/50 px-2 py-0.5 rounded-full">
                                                {categoryBrands.length}
                                            </span>
                                        </div>
                                    </button>

                                    {isUncategorized && !isCollapsed && (
                                        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
                                            <span className="font-semibold">{t("brands.uncategorizedTitle")}</span>{" "}
                                            {t("brands.uncategorizedSubtitle")}
                                        </div>
                                    )}

                                    {/* Brands Table */}
                                    {!isCollapsed && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/20 border-b border-borderc">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left font-semibold">{t('brands.table.logo')}</th>
                                                        <th className="px-6 py-3 text-left font-semibold">{t('brands.table.name')}</th>
                                                        <th className="px-6 py-3 text-left font-semibold">{t('brands.table.status')}</th>
                                                        <th className="px-6 py-3 text-right font-semibold">{t('brands.table.actions')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-borderc">
                                                    {categoryBrands.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-6 text-sm text-muted">
                                                                {t("brands.emptyCategory")}
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        categoryBrands.map((brand) => (
                                                            <tr
                                                                key={brand.id}
                                                                className={`transition-colors hover:bg-muted/5 ${isUncategorized ? "bg-amber-50/30" : ""}`}
                                                            >
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
                                                                    <Link
                                                                        href={`/admin/offers?brand=${brand.id}`}
                                                                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-zuma-600 hover:text-zuma-700 transition-colors"
                                                                        title={t("common.viewOffers")}
                                                                    >
                                                                        {t("common.viewOffers")}
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </Link>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${brand.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                                        }`}>
                                                                        {t(`brands.${brand.status}`)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => openEditModal(brand)}
                                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                            title={t('common.edit')}
                                                                        >
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setDeleteId(brand.id)}
                                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                            title={t('common.delete')}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
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
