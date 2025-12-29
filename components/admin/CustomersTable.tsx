"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowUp, ArrowDown, ArrowUpDown, Trash2, Loader2, User, Mail, Smartphone, Plus, Filter, X, Edit2, Power, PowerOff, Eye } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"

type Customer = {
    id: string
    name: string
    email: string
    whatsapp_e164: string
    country: string
    province: string
    orders_count: number
    delivered_total: number
    status: string
    created_at: string
}

export default function CustomersTable({ customers }: { customers: Customer[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp_e164: '',
        status: 'active' as 'active' | 'inactive'
    })

    const sort = searchParams.get('sort') || 'created_at'
    const dir = searchParams.get('dir') || 'desc'
    const query = searchParams.get('q') || ''
    const statusFilter = searchParams.get('status') || ''
    const page = searchParams.get('page') || '1'

    function resetForm() {
        setFormData({
            name: '',
            email: '',
            whatsapp_e164: '',
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
        if (selectedIds.size === customers.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(customers.map(c => c.id)))
        }
    }

    const handleBulkDeleteClick = () => {
        if (selectedIds.size === 0) return
        setShowConfirm(true)
    }

    const executeBulkDelete = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/customers/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            })

            if (!res.ok) throw new Error('Failed to delete')

            setSelectedIds(new Set())
            setShowConfirm(false)
            router.refresh()
        } catch (err) {
            alert('Falha ao excluir os clientes selecionados')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/customers/${deleteId}`, {
                method: 'DELETE',
            })

            if (!res.ok) throw new Error('Failed to delete customer')

            setDeleteId(null)
            router.refresh()
        } catch (err) {
            alert('Falha ao excluir cliente')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to create customer')

            resetForm()
            setShowCreateModal(false)
            router.refresh()
        } catch (err: any) {
            alert(`Erro ao criar cliente: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!editingCustomer) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to update customer')

            resetForm()
            setShowEditModal(false)
            setEditingCustomer(null)
            router.refresh()
        } catch (err: any) {
            console.error(err)
            alert(`Erro ao atualizar cliente: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (customer: Customer) => {
        setLoading(true)
        const newStatus = customer.status === 'active' ? 'inactive' : 'active'
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!res.ok) throw new Error('Failed to update status')
            router.refresh()
        } catch (err) {
            alert('Erro ao alterar status')
        } finally {
            setLoading(false)
        }
    }

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) params.set(key, value)
        else params.delete(key)
        params.set('page', '1')
        router.push(`?${params.toString()}`)
    }

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer)
        setFormData({
            name: customer.name,
            email: customer.email,
            whatsapp_e164: customer.whatsapp_e164,
            status: customer.status as any
        })
        setShowEditModal(true)
    }

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
        <div className="space-y-4">
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={executeBulkDelete}
                title="Excluir Clientes"
                description={`Tem certeza de que deseja excluir ${selectedIds.size} clientes? Esta ação não pode ser desfeita e removerá todo o histórico de pedidos deles.`}
                confirmText="Excluir Clientes"
                isDestructive={true}
                loading={loading}
            />

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Excluir Cliente"
                description={`Tem certeza de que deseja excluir este cliente? Toda a informação de perfil e pedidos será perdida.`}
                confirmText="Excluir Cliente"
                isDestructive={true}
                loading={loading}
            />

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="px-6 py-4 border-b border-borderc flex items-center justify-between">
                            <h2 className="text-xl font-bold">{showCreateModal ? 'Novo Cliente' : 'Editar Cliente'}</h2>
                            <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} className="p-2 hover:bg-muted/20 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Nome *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-transparent text-foreground border border-borderc rounded-xl focus:ring-2 focus:ring-zuma-500 outline-none"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-transparent text-foreground border border-borderc rounded-xl focus:ring-2 focus:ring-zuma-500 outline-none"
                                    placeholder="exemplo@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">WhatsApp (E.164) *</label>
                                <input
                                    type="text"
                                    value={formData.whatsapp_e164}
                                    onChange={e => setFormData({ ...formData, whatsapp_e164: e.target.value })}
                                    className="w-full px-4 py-2 bg-transparent text-foreground border border-borderc rounded-xl focus:ring-2 focus:ring-zuma-500 outline-none"
                                    placeholder="+25884..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full px-4 py-2 bg-transparent text-foreground border border-borderc rounded-xl focus:ring-2 focus:ring-zuma-500 outline-none"
                                >
                                    <option value="active" className="text-black dark:text-white bg-white dark:bg-neutral-800">Ativo</option>
                                    <option value="inactive" className="text-black dark:text-white bg-white dark:bg-neutral-800">Inativo</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-borderc flex justify-end gap-3">
                            <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} className="px-4 py-2 border border-borderc rounded-xl font-semibold hover:bg-muted/10 transition-colors">Cancelar</button>
                            <button
                                onClick={showCreateModal ? handleCreate : handleUpdate}
                                disabled={loading || !formData.name || !formData.email || !formData.whatsapp_e164}
                                className="px-6 py-2 bg-zuma-500 text-white rounded-xl font-semibold hover:bg-zuma-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Salvando...' : (showCreateModal ? 'Criar Cliente' : 'Salvar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-card p-4 rounded-xl border border-borderc shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted" />
                    <span className="text-sm font-semibold">Filtrar por Status:</span>
                </div>
                <select
                    value={statusFilter}
                    onChange={e => updateFilter('status', e.target.value)}
                    className="px-3 py-1.5 border border-borderc rounded-lg text-sm outline-none focus:ring-2 focus:ring-zuma-500 bg-transparent"
                >
                    <option value="">Todos</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </select>

                <div className="ml-auto flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-zuma-500 text-white rounded-xl text-sm font-bold hover:bg-zuma-600 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Cliente
                    </button>
                </div>
            </div>

            {selectedIds.size > 0 && (
                <div className="p-2 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm text-red-700 font-medium ml-2">{selectedIds.size} clientes selecionados</span>
                    <button
                        onClick={handleBulkDeleteClick}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Excluir Selecionados
                    </button>
                </div>
            )}

            <div className="overflow-x-auto bg-card rounded-xl border border-borderc shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30 border-b border-borderc">
                        <tr>
                            <th className="px-4 py-3 w-[40px]">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-zuma-600 focus:ring-zuma-500 cursor-pointer"
                                    checked={customers.length > 0 && selectedIds.size === customers.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                <Link href={createSortLink('name')} className="group inline-flex items-center hover:text-foreground">
                                    Cliente <SortIcon col="name" />
                                </Link>
                            </th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                <Link href={createSortLink('orders_count')} className="group inline-flex items-center hover:text-foreground">
                                    Pedidos <SortIcon col="orders_count" />
                                </Link>
                            </th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                <Link href={createSortLink('delivered_total')} className="group inline-flex items-center hover:text-foreground">
                                    Total Gasto <SortIcon col="delivered_total" />
                                </Link>
                            </th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                <Link href={createSortLink('status')} className="group inline-flex items-center hover:text-foreground">
                                    Status <SortIcon col="status" />
                                </Link>
                            </th>
                            <th className="px-4 py-3 font-semibold whitespace-nowrap">
                                <Link href={createSortLink('created_at')} className="group inline-flex items-center hover:text-foreground">
                                    Desde <SortIcon col="created_at" />
                                </Link>
                            </th>
                            <th className="px-4 py-3 font-semibold text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borderc">
                        {customers.map((c) => (
                            <tr key={c.id} className={`hover:bg-muted/20 transition-colors ${selectedIds.has(c.id) ? 'bg-muted/10' : ''}`}>
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-zuma-600 focus:ring-zuma-500 cursor-pointer"
                                        checked={selectedIds.has(c.id)}
                                        onChange={() => toggleSelect(c.id)}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <Link href={`/admin/customers/${c.id}`} className="font-semibold text-foreground hover:text-zuma-500 transition-colors">
                                            {c.name}
                                        </Link>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>
                                            <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> {c.whatsapp_e164}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-medium">{c.orders_count}</td>
                                <td className="px-4 py-3 font-medium">{c.delivered_total.toLocaleString()} MT</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {c.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => toggleStatus(c)}
                                            className={`p-1.5 rounded-md transition-all ${c.status === 'active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                                            title={c.status === 'active' ? 'Inativar' : 'Ativar'}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (c.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />)}
                                        </button>
                                        <Link
                                            href={`/admin/customers/${c.id}`}
                                            className="p-1.5 text-muted hover:text-zuma-500 hover:bg-zuma-50 rounded-md transition-all"
                                            title="Ver Detalhes"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => openEditModal(c)}
                                            className="p-1.5 text-muted hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                            title="Editar Cliente"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(c.id)}
                                            className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                            title="Excluir Cliente"
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
    )
}
