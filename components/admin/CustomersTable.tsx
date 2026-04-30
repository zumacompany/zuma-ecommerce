"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Trash2,
  Loader2,
  Mail,
  Smartphone,
  Plus,
  Filter,
  X,
  Edit2,
  Power,
  PowerOff,
  Eye,
} from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import { useI18n } from "../../lib/i18n"
import { btnPrimary, btnSecondary, input, label, table, th, td, trHover } from "../ui/classes"

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
  const { t, locale } = useI18n()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp_e164: "",
    status: "active" as "active" | "inactive",
  })

  const sort = searchParams.get("sort") || "created_at"
  const dir = searchParams.get("dir") || "desc"
  const query = searchParams.get("q") || ""
  const statusFilter = searchParams.get("status") || ""
  const page = searchParams.get("page") || "1"

  const currencyLabel = locale === "pt" ? "MT" : "MZN"

  function resetForm() {
    setFormData({
      name: "",
      email: "",
      whatsapp_e164: "",
      status: "active",
    })
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(customers.map((c) => c.id)))
  }

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return
    setShowConfirm(true)
  }

  const executeBulkDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/customers/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })

      if (!res.ok) throw new Error("Failed to delete")

      setSelectedIds(new Set())
      setShowConfirm(false)
      router.refresh()
    } catch (err) {
      alert(t("customers.deleteError"))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/${deleteId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete customer")

      setDeleteId(null)
      router.refresh()
    } catch (err) {
      alert(t("customers.deleteError"))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create customer")

      resetForm()
      setShowCreateModal(false)
      router.refresh()
    } catch (err: any) {
      alert(`${t("customers.createError")}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCustomer) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update customer")

      resetForm()
      setShowEditModal(false)
      setEditingCustomer(null)
      router.refresh()
    } catch (err: any) {
      alert(`${t("customers.updateError")}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (customer: Customer) => {
    setLoading(true)
    const newStatus = customer.status === "active" ? "inactive" : "active"
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error("Failed to update status")
      router.refresh()
    } catch (err) {
      alert(t("customers.toggleStatusError"))
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      whatsapp_e164: customer.whatsapp_e164,
      status: customer.status as any,
    })
    setShowEditModal(true)
  }

  const createSortLink = (col: string) => {
    const isCurrent = sort === col
    const newDir = isCurrent && dir === "asc" ? "desc" : "asc"
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (Number(page) > 1) params.set("page", page)
    params.set("sort", col)
    params.set("dir", newDir)
    return `?${params.toString()}`
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sort !== col) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted/40" />
    return dir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-zuma-500" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-zuma-500" />
    )
  }

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeBulkDelete}
        title={t("customers.bulkDeleteTitle")}
        description={t("customers.bulkDeleteDescription", { count: selectedIds.size })}
        confirmText={t("customers.bulkDeleteTitle")}
        isDestructive={true}
        loading={loading}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("customers.deleteTitle")}
        description={t("customers.deleteDescription")}
        confirmText={t("customers.deleteTitle")}
        isDestructive={true}
        loading={loading}
      />

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card shadow-pop">
            <div className="flex items-center justify-between border-b border-borderc px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {t("nav.customers")}
                </p>
                <h2 className="text-xl font-semibold">
                  {showCreateModal ? t("customers.newCustomer") : t("customers.editCustomer")}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
                className="rounded-lg p-2 text-muted transition hover:bg-muted/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="space-y-2">
                <label className={label}>{t("customers.name")}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={input}
                  placeholder={t("customers.name")}
                />
              </div>
              <div className="space-y-2">
                <label className={label}>{t("customers.email")}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={input}
                  placeholder={t("customers.email")}
                />
              </div>
              <div className="space-y-2">
                <label className={label}>{t("customers.whatsapp")}</label>
                <input
                  type="text"
                  value={formData.whatsapp_e164}
                  onChange={(e) => setFormData({ ...formData, whatsapp_e164: e.target.value })}
                  className={input}
                  placeholder={t("customers.whatsapp")}
                />
              </div>
              <div className="space-y-2">
                <label className={label}>{t("customers.status")}</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className={input}
                >
                  <option value="active">{t("customers.itemStatus.active")}</option>
                  <option value="inactive">{t("customers.itemStatus.inactive")}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-borderc px-6 py-4">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  resetForm()
                }}
                className={btnSecondary}
              >
                {t("customers.cancel")}
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleUpdate}
                disabled={loading || !formData.name || !formData.email || !formData.whatsapp_e164}
                className={btnPrimary}
              >
                {loading ? t("customers.saving") : showCreateModal ? t("customers.createCustomer") : t("customers.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-borderc bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <Filter className="h-4 w-4" />
          {t("customers.filterByStatus")}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="rounded-xl border border-borderc bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zuma-500"
        >
          <option value="">{t("customers.all")}</option>
          <option value="active">{t("customers.itemStatus.active")}</option>
          <option value="inactive">{t("customers.itemStatus.inactive")}</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className={`${btnPrimary} gap-2`}
          >
            <Plus className="h-4 w-4" />
            {t("customers.newCustomer")}
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
          <span className="text-sm font-semibold text-red-700">
            {t("customers.bulk.selected", { count: selectedIds.size })}
          </span>
          <button
            onClick={handleBulkDeleteClick}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            {t("customers.bulk.bulkDeleteSelected")}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-borderc bg-card shadow-card">
        <table className={table}>
          <thead>
            <tr>
              <th className={`${th} w-[40px]`}>
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-zuma-600 focus:ring-zuma-500 cursor-pointer"
                  checked={customers.length > 0 && selectedIds.size === customers.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className={th}>
                <Link href={createSortLink("name")} className="group inline-flex items-center hover:text-foreground">
                  {t("customers.table.client")} <SortIcon col="name" />
                </Link>
              </th>
              <th className={th}>
                <Link href={createSortLink("orders_count")} className="group inline-flex items-center hover:text-foreground">
                  {t("customers.table.orders")} <SortIcon col="orders_count" />
                </Link>
              </th>
              <th className={th}>
                <Link href={createSortLink("delivered_total")} className="group inline-flex items-center hover:text-foreground">
                  {t("customers.table.totalSpent")} <SortIcon col="delivered_total" />
                </Link>
              </th>
              <th className={th}>
                <Link href={createSortLink("status")} className="group inline-flex items-center hover:text-foreground">
                  {t("customers.status")} <SortIcon col="status" />
                </Link>
              </th>
              <th className={th}>
                <Link href={createSortLink("created_at")} className="group inline-flex items-center hover:text-foreground">
                  {t("customers.table.since")} <SortIcon col="created_at" />
                </Link>
              </th>
              <th className={`${th} text-right`}>{t("customers.table.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderc">
            {customers.map((c) => (
              <tr key={c.id} className={trHover}>
                <td className={td}>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-zuma-600 focus:ring-zuma-500 cursor-pointer"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                  />
                </td>
                <td className={td}>
                  <div className="flex flex-col">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-semibold text-foreground hover:text-zuma-500 transition-colors"
                    >
                      {c.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {c.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" /> {c.whatsapp_e164}
                      </span>
                    </div>
                  </div>
                </td>
                <td className={`${td} font-semibold`}>{c.orders_count}</td>
                <td className={`${td} font-semibold`}>
                  {c.delivered_total.toLocaleString(locale === "pt" ? "pt-MZ" : "en-US")} {currencyLabel}
                </td>
                <td className={td}>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      c.status === "active"
                        ? "bg-success-50 text-success-700"
                        : "bg-danger-50 text-danger-700"
                    }`}
                  >
                    {c.status === "active" ? t("customers.itemStatus.active") : t("customers.itemStatus.inactive")}
                  </span>
                </td>
                <td className={`${td} text-muted`}>
                  {new Date(c.created_at).toLocaleDateString(locale === "pt" ? "pt-MZ" : "en-US")}
                </td>
                <td className={`${td} text-right`}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggleStatus(c)}
                      className={`rounded-lg p-2 transition ${
                        c.status === "active"
                          ? "text-warning-700 hover:bg-warning-50"
                          : "text-success-700 hover:bg-success-50"
                      }`}
                      title={c.status === "active" ? t("common.deactivate") : t("common.activate")}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : c.status === "active" ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </button>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="rounded-lg p-2 text-muted transition hover:bg-muted/20 hover:text-foreground"
                      title={t("common.viewDetails")}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => openEditModal(c)}
                      className="rounded-lg p-2 text-muted transition hover:bg-muted/20 hover:text-zuma-600"
                      title={t("customers.editCustomer")}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="rounded-lg p-2 text-muted transition hover:bg-danger-50 hover:text-danger-500"
                      title={t("customers.deleteTitle")}
                    >
                      <Trash2 className="h-4 w-4" />
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
