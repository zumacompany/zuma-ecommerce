"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Edit2, Trash2, X, Filter, Loader2, Power, PowerOff } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"

type Offer = {
    id: string
    brand_id: string
    region_code: string
    denomination_value: number
    denomination_currency: string
    price: number
    status: 'active' | 'inactive'
    created_at: string
    brand: { id: string; name: string; slug: string } | null
    region: { code: string; name: string } | null
}

type Brand = {
    id: string
    name: string
}

type Region = {
    code: string
    name: string
}

export default function OffersManager({
    initialOffers,
    brands,
    regions,
    currentFilters
}: {
    initialOffers: Offer[]
    brands: Brand[]
    regions: Region[]
    currentFilters: {
        brand: string
        region: string
        status: string
    }
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [offers, setOffers] = useState(initialOffers)

    // Sync state with props when filters change
    useEffect(() => {
        setOffers(initialOffers)
        setBrandFilter(currentFilters.brand)
        setRegionFilter(currentFilters.region)
        setStatusFilter(currentFilters.status)
        // Clear selection if current items change (e.g. after filter)
        setSelectedIds(new Set())
    }, [initialOffers, currentFilters])

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [showBulkConfirm, setShowBulkConfirm] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        brand_id: '',
        region_code: '',
        denomination_value: '',
        denomination_currency: '',
        price: '',
        status: 'active' as 'active' | 'inactive'
    })
    const [loading, setLoading] = useState(false)

    // Filter states
    const [brandFilter, setBrandFilter] = useState(currentFilters.brand)
    const [regionFilter, setRegionFilter] = useState(currentFilters.region)
    const [statusFilter, setStatusFilter] = useState(currentFilters.status)

    function resetForm() {
        setFormData({
            brand_id: '',
            region_code: '',
            denomination_value: '',
            denomination_currency: '',
            price: '',
            status: 'active'
        })
    }

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === offers.length && offers.length > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(offers.map(o => o.id)))
        }
    }

    const updateFilter = (key: 'brand' | 'region' | 'status', value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) params.set(key, value)
        else params.delete(key)

        if (key === 'brand') setBrandFilter(value)
        if (key === 'region') setRegionFilter(value)
        if (key === 'status') setStatusFilter(value)

        router.push(`/admin/offers?${params.toString()}`)
    }

    function clearFilters() {
        setBrandFilter('')
        setRegionFilter('')
        setStatusFilter('')
        router.push('/admin/offers')
    }

    async function handleCreate() {
        if (!formData.brand_id || !formData.region_code || !formData.denomination_value || !formData.price) {
            alert('Por favor, preencha todos os campos obrigatórios')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/admin/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand_id: formData.brand_id,
                    region_code: formData.region_code,
                    denomination_value: parseFloat(formData.denomination_value),
                    denomination_currency: formData.denomination_currency,
                    price: parseFloat(formData.price),
                    status: formData.status
                })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Falha ao criar')

            resetForm()
            setShowCreateModal(false)
            router.refresh()
        } catch (err: any) {
            alert(`Falha ao criar oferta: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdate() {
        if (!editingOffer) return

        setLoading(true)
        try {
            const res = await fetch(`/api/admin/offers/${editingOffer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand_id: formData.brand_id,
                    region_code: formData.region_code,
                    denomination_value: parseFloat(formData.denomination_value),
                    denomination_currency: formData.denomination_currency,
                    price: parseFloat(formData.price),
                    status: formData.status
                })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Falha ao atualizar')

            resetForm()
            setShowEditModal(false)
            setEditingOffer(null)
            router.refresh()
        } catch (err: any) {
            alert(`Falha ao atualizar oferta: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!deleteId) return

        setLoading(true)
        try {
            const res = await fetch(`/api/admin/offers/${deleteId}`, {
                method: 'DELETE'
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Falha ao excluir')

            setDeleteId(null)
            // Optimize UI by removing locally immediately
            setOffers(prev => prev.filter(o => o.id !== deleteId))
            router.refresh()
        } catch (err: any) {
            setDeleteId(null) // Close modal on error to allow user to see alert
            const msg = err.message || ''
            if (msg.includes('violates foreign key constraint') || msg.includes('as_item_offer_id_fkey')) {
                alert('Esta oferta não pode ser excluída porque já foi usada em pedidos. Ela foi mantida na lista, mas você pode inativá-la.')
            } else {
                alert(`Falha ao excluir oferta: ${err.message}`)
            }
        } finally {
            setLoading(false)
        }
    }

    async function toggleStatus(offer: Offer) {
        setLoading(true)
        const newStatus = offer.status === 'active' ? 'inactive' : 'active'
        try {
            const res = await fetch(`/api/admin/offers/${offer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Falha ao alterar status')

            router.refresh()
        } catch (err: any) {
            alert(`Erro ao alterar status: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    async function executeBulkDelete() {
        if (selectedIds.size === 0) return

        setLoading(true)
        try {
            const res = await fetch('/api/admin/offers/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Falha ao excluir ofertas')

            const deletedIdsArray = Array.from(selectedIds)
            setOffers(prev => prev.filter(o => !deletedIdsArray.includes(o.id)))
            setSelectedIds(new Set())
            setShowBulkConfirm(false)
            router.refresh()
        } catch (err: any) {
            setShowBulkConfirm(false) // Close modal on error
            const msg = err.message || ''
            if (msg.includes('violates foreign key constraint') || msg.includes('as_item_offer_id_fkey')) {
                alert('Algumas das ofertas selecionadas não podem ser excluídas porque já foram usadas em pedidos. Elas foram mantidas, mas você pode inativá-las.')
            } else {
                alert(`Falha ao excluir selecionados: ${err.message}`)
            }
        } finally {
            setLoading(false)
        }
    }

    function openEditModal(offer: Offer) {
        setEditingOffer(offer)
        setFormData({
            brand_id: offer.brand_id,
            region_code: offer.region_code,
            denomination_value: offer.denomination_value.toString(),
            denomination_currency: offer.denomination_currency,
            price: offer.price.toString(),
            status: offer.status
        })
        setShowEditModal(true)
    }

    const offerToDelete = offers.find(o => o.id === deleteId)
    const hasActiveFilters = brandFilter || regionFilter || statusFilter

    return (
        <div className="space-y-6">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Excluir Oferta"
                description={`Tem certeza de que deseja excluir esta oferta? Esta ação não pode ser desfeita.`}
                confirmText="Excluir Oferta"
                isDestructive={true}
                loading={loading}
            />

            <ConfirmationModal
                isOpen={showBulkConfirm}
                onClose={() => setShowBulkConfirm(false)}
                onConfirm={executeBulkDelete}
                title="Excluir Ofertas"
                description={`Tem certeza de que deseja excluir ${selectedIds.size} ofertas selecionadas? Esta ação não pode ser desfeita.`}
                confirmText="Excluir Selecionadas"
                isDestructive={true}
                loading={loading}
            />

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card border-b border-borderc px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">{showCreateModal ? 'Criar Oferta' : 'Editar Oferta'}</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setShowEditModal(false)
                                    setEditingOffer(null)
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
                                    <label className="block text-sm font-semibold mb-2">Marca *</label>
                                    <select
                                        value={formData.brand_id}
                                        onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecionar marca</option>
                                        {(brands || []).map(brand => (
                                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Região *</label>
                                    <select
                                        value={formData.region_code}
                                        onChange={(e) => setFormData({ ...formData, region_code: e.target.value })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecionar região</option>
                                        {(regions || []).map(region => (
                                            <option key={region.code} value={region.code}>{region.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Valor da Denominação *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.denomination_value}
                                        onChange={(e) => setFormData({ ...formData, denomination_value: e.target.value })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Moeda *</label>
                                    <input
                                        type="text"
                                        value={formData.denomination_currency}
                                        onChange={(e) => setFormData({ ...formData, denomination_currency: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="USD"
                                        maxLength={3}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Preço *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="95.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-card border-t border-borderc px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false)
                                    setShowEditModal(false)
                                    setEditingOffer(null)
                                    resetForm()
                                }}
                                className="px-4 py-2 border border-borderc rounded-xl font-semibold hover:bg-muted/20 transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={showCreateModal ? handleCreate : handleUpdate}
                                disabled={loading || !formData.brand_id || !formData.region_code || !formData.denomination_value || !formData.price}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Salvando...' : (showCreateModal ? 'Criar Oferta' : 'Atualizar Oferta')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="bg-card rounded-2xl border border-borderc p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-muted" />
                        <span className="font-semibold">Filtros:</span>
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-left-2 transition-all">
                            <span className="text-sm font-bold text-red-600 px-1">{selectedIds.size} selecionados</span>
                            <button
                                onClick={() => setShowBulkConfirm(true)}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Excluir Selecionados
                            </button>
                        </div>
                    )}

                    <select
                        value={brandFilter}
                        onChange={(e) => updateFilter('brand', e.target.value)}
                        className="px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">Todas as marcas</option>
                        {(brands || []).map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>

                    <select
                        value={regionFilter}
                        onChange={(e) => updateFilter('region', e.target.value)}
                        className="px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">Todas as regiões</option>
                        {(regions || []).map(region => (
                            <option key={region.code} value={region.code}>{region.name}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => updateFilter('status', e.target.value)}
                        className="px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="">Todos os status</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </select>


                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 border border-borderc rounded-xl font-semibold hover:bg-muted/20 transition-colors text-sm"
                        >
                            Limpar
                        </button>
                    )}

                    <div className="ml-auto">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Oferta
                        </button>
                    </div>
                </div>
            </div>

            {/* Offers Table */}
            {offers.length === 0 ? (
                <div className="bg-card rounded-2xl border border-borderc p-12">
                    <EmptyState
                        title={hasActiveFilters ? "Nenhuma oferta corresponde aos seus filtros" : "Nenhuma oferta ainda"}
                        description={hasActiveFilters ? "Tente ajustar seus filtros ou criar uma nova oferta." : "Crie sua primeira oferta para começar a vender cartões-presente."}
                        icon={<Plus className="w-12 h-12 text-muted/30" />}
                        ctaLabel="Criar Oferta"
                        onClick={() => setShowCreateModal(true)}
                    />
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-borderc shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-borderc bg-muted/30 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Lista</h2>
                        <span className="text-sm text-muted bg-muted/50 px-3 py-1 rounded-full">
                            {offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/20 border-b border-borderc">
                                <tr>
                                    <th className="px-6 py-3 w-[40px]">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={offers.length > 0 && selectedIds.size === offers.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold">Marca</th>
                                    <th className="px-6 py-3 text-left font-semibold">Região</th>
                                    <th className="px-6 py-3 text-left font-semibold">Denominação</th>
                                    <th className="px-6 py-3 text-left font-semibold">Preço</th>
                                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                                    <th className="px-6 py-3 text-right font-semibold">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-borderc">
                                {offers.map((offer) => (
                                    <tr key={offer.id} className={`hover:bg-muted/5 transition-colors ${selectedIds.has(offer.id) ? 'bg-blue-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedIds.has(offer.id)}
                                                onChange={() => toggleSelect(offer.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-semibold">{offer.brand?.name || 'Desconhecido'}</td>
                                        <td className="px-6 py-4">{offer.region?.name || offer.region_code}</td>
                                        <td className="px-6 py-4">{offer.denomination_value} {offer.denomination_currency}</td>
                                        <td className="px-6 py-4 font-medium">{offer.price}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${offer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {offer.status === 'active' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleStatus(offer)}
                                                    className={`p-2 rounded-lg transition-colors ${offer.status === 'active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                                    title={offer.status === 'active' ? 'Inativar' : 'Ativar'}
                                                    disabled={loading}
                                                >
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (offer.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />)}
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(offer)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(offer.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
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
                </div>
            )}
        </div>
    )
}
