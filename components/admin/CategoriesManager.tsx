"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, X, Check, Search } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"

type Category = {
    id: string
    name: string
    slug: string
    color?: string
    icon?: string
    created_at: string
}

export default function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
    const router = useRouter()
    const [categories, setCategories] = useState(initialCategories)
    const [searchTerm, setSearchTerm] = useState("")

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

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim() || !newSlug.trim()) return

        setCreating(true)
        try {
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    slug: newSlug.trim(),
                    color: newColor,
                    icon: newIcon
                })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Falha ao criar')

            setNewName('')
            setNewSlug('')
            setNewColor('bg-gray-200')
            setNewIcon('📦')
            router.refresh()
        } catch (err: any) {
            alert(`Falha ao criar categoria: ${err.message}`)
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
            if (!res.ok) throw new Error(json.error || 'Falha ao atualizar')

            cancelEdit()
            router.refresh()
        } catch (err: any) {
            alert(`Falha ao atualizar categoria: ${err.message}`)
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
            if (!res.ok) throw new Error(json.error || 'Falha ao excluir')

            setDeleteId(null)
            router.refresh()
        } catch (err: any) {
            alert(`Falha ao excluir categoria: ${err.message}`)
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
            if (!res.ok) throw new Error(json.error || 'Falha ao excluir tudo')

            setShowDeleteAllModal(false)
            router.refresh()
        } catch (err: any) {
            alert(`Falha ao excluir todas as categorias: ${err.message}`)
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
                title="Excluir Categoria"
                description={`Tem certeza de que deseja excluir "${categoryToDelete?.name}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir Categoria"
                isDestructive={true}
                loading={deleting}
            />

            <ConfirmationModal
                isOpen={showDeleteAllModal}
                onClose={() => setShowDeleteAllModal(false)}
                onConfirm={handleDeleteAll}
                title="Apagar Tudo"
                description="Tem certeza de que deseja apagar TODAS as categorias? Esta ação é irreversível e removerá todos os dados."
                confirmText="Apagar Tudo"
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
                    Apagar Tudo
                </button>
            </div>

            {/* Create Form */}
            <div className="bg-card rounded-2xl border border-borderc p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Nova Categoria</h2>
                <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Nome"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                        disabled={creating}
                    />
                    <input
                        type="text"
                        placeholder="Slug"
                        value={newSlug}
                        onChange={(e) => setNewSlug(e.target.value)}
                        className="flex-1 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                        disabled={creating}
                    />
                    <input
                        type="text"
                        placeholder="Ícone (ex: 🎮)"
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        className="w-24 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500 text-center"
                        disabled={creating}
                    />
                    <select
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-40 px-4 py-2 border border-borderc rounded-xl focus:outline-none focus:ring-2 focus:ring-zuma-500"
                        disabled={creating}
                    >
                        <option value="bg-gray-200">Cinza</option>
                        <option value="bg-[#40C4FF]">Azul</option>
                        <option value="bg-[#FF5252]">Vermelho</option>
                        <option value="bg-[#B2EBF2]">Céu</option>
                        <option value="bg-orange-300">Laranja</option>
                        <option value="bg-purple-300">Roxo</option>
                        <option value="bg-green-300">Verde</option>
                    </select>
                    <button
                        type="submit"
                        disabled={creating || !newName.trim() || !newSlug.trim()}
                        className="px-6 py-2 bg-zuma-500 text-white rounded-xl font-semibold hover:bg-zuma-600 transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                        <Plus className="w-4 h-4" />
                        Criar
                    </button>
                </form>
            </div>

            {/* Categories List */}
            <div className="bg-card rounded-2xl border border-borderc shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-borderc bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold">Categorias</h2>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            placeholder="Buscar categorias..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-borderc rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zuma-500 w-full md:w-64"
                        />
                    </div>
                </div>

                {filteredCategories.length === 0 ? (
                    <div className="p-12">
                        <EmptyState
                            title={searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria ainda"}
                            description={searchTerm ? `Não encontramos nada para "${searchTerm}"` : "Crie sua primeira categoria para organizar seus produtos."}
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
                                            <option value="bg-gray-200">Cinza</option>
                                            <option value="bg-[#40C4FF]">Azul</option>
                                            <option value="bg-[#FF5252]">Vermelho</option>
                                            <option value="bg-[#B2EBF2]">Céu</option>
                                            <option value="bg-orange-300">Laranja</option>
                                            <option value="bg-purple-300">Roxo</option>
                                            <option value="bg-green-300">Verde</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdate}
                                                disabled={updating}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                disabled={updating}
                                                className="p-2 text-muted hover:bg-muted/20 rounded-lg"
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
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(category.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
