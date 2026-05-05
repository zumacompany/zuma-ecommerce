"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Filter,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"
import CatalogFlowBar from "./CatalogFlowBar"
import { useI18n } from "../../lib/i18n"
import { btnPrimary, btnSecondary, input, label } from "../ui/classes"

type Offer = {
  id: string
  brand_id: string
  region_code: string
  denomination_value: number
  denomination_currency: string
  price: number
  cost_price?: number
  stock_quantity?: number | null
  is_unlimited?: boolean
  auto_fulfill?: boolean
  product_id?: string | null
  show_when_out_of_stock?: boolean
  status: "active" | "inactive"
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
  currentFilters,
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
  const { t } = useI18n()
  const [offers, setOffers] = useState(initialOffers)

  useEffect(() => {
    setOffers(initialOffers)
    setBrandFilter(currentFilters.brand)
    setRegionFilter(currentFilters.region)
    setStatusFilter(currentFilters.status)
    setSelectedIds(new Set())
  }, [initialOffers, currentFilters])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const [formData, setFormData] = useState({
    brand_id: "",
    region_code: "",
    denomination_value: "",
    denomination_currency: "",
    price: "",
    status: "active" as "active" | "inactive",
    show_when_out_of_stock: true,
  })
  const [loading, setLoading] = useState(false)

  const [brandFilter, setBrandFilter] = useState(currentFilters.brand)
  const [regionFilter, setRegionFilter] = useState(currentFilters.region)
  const [statusFilter, setStatusFilter] = useState(currentFilters.status)

  const totalCount = offers.length
  const activeCount = offers.filter((o) => o.status === "active").length
  const inactiveCount = offers.filter((o) => o.status === "inactive").length

  function stockLabel(stock?: number | null) {
    if (stock === null || stock === undefined) return { label: t("offers.stock.unknown"), tone: "muted" }
    if (stock <= 0) return { label: t("offers.stock.out"), tone: "danger" }
    if (stock <= 5) return { label: t("offers.stock.low"), tone: "warning" }
    return { label: t("offers.stock.ok"), tone: "success" }
  }

  function resetForm() {
    setFormData({
      brand_id: "",
      region_code: "",
      denomination_value: "",
      denomination_currency: "",
      price: "",
      status: "active",
      show_when_out_of_stock: true,
    })
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === offers.length && offers.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(offers.map((o) => o.id)))
    }
  }

  const updateFilter = (key: "brand" | "region" | "status", value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)

    if (key === "brand") setBrandFilter(value)
    if (key === "region") setRegionFilter(value)
    if (key === "status") setStatusFilter(value)

    router.push(`/admin/offers?${params.toString()}`)
  }

  function clearFilters() {
    setBrandFilter("")
    setRegionFilter("")
    setStatusFilter("")
    router.push("/admin/offers")
  }

  async function handleCreate() {
    if (
      !formData.brand_id ||
      !formData.region_code ||
      !formData.denomination_value ||
      !formData.price
    ) {
      alert(t("offers.messages.required"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: formData.brand_id,
          region_code: formData.region_code,
          denomination_value: parseFloat(formData.denomination_value),
          denomination_currency: formData.denomination_currency,
          price: parseFloat(formData.price),
          status: formData.status,
          show_when_out_of_stock: formData.show_when_out_of_stock,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")

      resetForm()
      setShowCreateModal(false)
      router.refresh()
    } catch (err: any) {
      alert(`${t("offers.messages.createError")}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate() {
    if (!editingOffer) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/offers/${editingOffer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: formData.brand_id,
          region_code: formData.region_code,
          denomination_value: parseFloat(formData.denomination_value),
          denomination_currency: formData.denomination_currency,
          price: parseFloat(formData.price),
          status: formData.status,
          show_when_out_of_stock: formData.show_when_out_of_stock,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")

      resetForm()
      setShowEditModal(false)
      setEditingOffer(null)
      router.refresh()
    } catch (err: any) {
      alert(`${t("offers.messages.updateError")}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/offers/${deleteId}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")

      setDeleteId(null)
      setOffers((prev) => prev.filter((o) => o.id !== deleteId))
      router.refresh()
    } catch (err: any) {
      setDeleteId(null)
      const msg = err.message || ""
      if (
        msg.includes("violates foreign key constraint") ||
        msg.includes("as_item_offer_id_fkey")
      ) {
        alert(t("offers.messages.deleteBlocked"))
      } else {
        alert(`${t("offers.messages.deleteError")}: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus(offer: Offer) {
    setLoading(true)
    const newStatus = offer.status === "active" ? "inactive" : "active"
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")

      router.refresh()
    } catch (err: any) {
      alert(`${t("offers.messages.updateError")}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function executeBulkDelete() {
    if (selectedIds.size === 0) return

    setLoading(true)
    try {
      const res = await fetch("/api/admin/offers/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")

      const deletedIdsArray = Array.from(selectedIds)
      setOffers((prev) => prev.filter((o) => !deletedIdsArray.includes(o.id)))
      setSelectedIds(new Set())
      setShowBulkConfirm(false)
      router.refresh()
    } catch (err: any) {
      setShowBulkConfirm(false)
      const msg = err.message || ""
      if (
        msg.includes("violates foreign key constraint") ||
        msg.includes("as_item_offer_id_fkey")
      ) {
        alert(t("offers.messages.deleteBlocked"))
      } else {
        alert(`${t("offers.messages.deleteError")}: ${err.message}`)
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
      status: offer.status,
      show_when_out_of_stock: offer.show_when_out_of_stock ?? true,
    })
    setShowEditModal(true)
  }

  const hasActiveFilters = brandFilter || regionFilter || statusFilter

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("offers.delete.title")}
        description={t("offers.delete.description")}
        confirmText={t("offers.delete.confirm")}
        isDestructive={true}
        loading={loading}
      />

      <ConfirmationModal
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        onConfirm={executeBulkDelete}
        title={t("offers.bulk.title")}
        description={t("offers.bulk.description", { count: selectedIds.size })}
        confirmText={t("offers.bulk.confirm")}
        isDestructive={true}
        loading={loading}
      />

      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-pop">
            <div className="sticky top-0 flex items-center justify-between border-b border-borderc bg-card px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {t("nav.offers")}
                </p>
                <h2 className="text-xl font-semibold">
                  {showCreateModal ? t("offers.create") : t("offers.edit")}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setEditingOffer(null)
                  resetForm()
                }}
                className="rounded-lg p-2 text-muted transition hover:bg-muted/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={label}>{t("offers.fields.brand")}</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) =>
                      setFormData({ ...formData, brand_id: e.target.value })
                    }
                    className={input}
                  >
                    <option value="">{t("offers.placeholders.brand")}</option>
                    {(brands || []).map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={label}>{t("offers.fields.region")}</label>
                  <select
                    value={formData.region_code}
                    onChange={(e) =>
                      setFormData({ ...formData, region_code: e.target.value })
                    }
                    className={input}
                  >
                    <option value="">{t("offers.placeholders.region")}</option>
                    {(regions || []).map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={label}>{t("offers.fields.denomination")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.denomination_value}
                    onChange={(e) =>
                      setFormData({ ...formData, denomination_value: e.target.value })
                    }
                    className={input}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <label className={label}>{t("offers.fields.currency")}</label>
                  <input
                    type="text"
                    value={formData.denomination_currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        denomination_currency: e.target.value.toUpperCase(),
                      })
                    }
                    className={input}
                    placeholder="USD"
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={label}>{t("offers.fields.price")}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={input}
                    placeholder="95.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className={label}>{t("offers.fields.status")}</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className={input}
                  >
                    <option value="active">{t("common.active")}</option>
                    <option value="inactive">{t("common.inactive")}</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className={`${label} flex items-start gap-2 cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={formData.show_when_out_of_stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          show_when_out_of_stock: e.target.checked,
                        })
                      }
                      className="mt-1 rounded border-borderc"
                    />
                    <span>
                      <span className="block">{t("offers.fields.showWhenOutOfStock")}</span>
                      <span className="block text-xs font-normal text-muted">
                        {t("offers.fields.showWhenOutOfStockHelp")}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-borderc bg-card px-6 py-4">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setEditingOffer(null)
                  resetForm()
                }}
                className={btnSecondary}
                disabled={loading}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleUpdate}
                disabled={
                  loading ||
                  !formData.brand_id ||
                  !formData.region_code ||
                  !formData.denomination_value ||
                  !formData.price
                }
                className={btnPrimary}
              >
                {loading ? t("common.processing") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      <CatalogFlowBar current="offers" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("nav.offers")}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{t("offers.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("offers.subtitle")}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className={`${btnPrimary} gap-2`}>
          <Plus className="h-4 w-4" />
          {t("offers.create")}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="rounded-full border border-borderc bg-card px-4 py-2 text-xs font-semibold text-foreground">
          {t("offers.stats.total", { count: totalCount })}
        </span>
        <span className="rounded-full border border-success-500/20 bg-success-50/70 px-4 py-2 text-xs font-semibold text-success-700">
          {t("offers.stats.active", { count: activeCount })}
        </span>
        <span className="rounded-full border border-borderc bg-muted/20 px-4 py-2 text-xs font-semibold text-muted">
          {t("offers.stats.inactive", { count: inactiveCount })}
        </span>
      </div>

      <div className="rounded-2xl border border-borderc bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Filter className="h-4 w-4" />
            {t("common.filter")}
          </div>

          <select
            value={brandFilter}
            onChange={(e) => updateFilter("brand", e.target.value)}
            className="min-w-[180px] rounded-xl border border-borderc bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zuma-500"
          >
            <option value="">{t("offers.filters.brand")}</option>
            {(brands || []).map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          <select
            value={regionFilter}
            onChange={(e) => updateFilter("region", e.target.value)}
            className="min-w-[180px] rounded-xl border border-borderc bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zuma-500"
          >
            <option value="">{t("offers.filters.region")}</option>
            {(regions || []).map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="min-w-[160px] rounded-xl border border-borderc bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-zuma-500"
          >
            <option value="">{t("offers.filters.status")}</option>
            <option value="active">{t("common.active")}</option>
            <option value="inactive">{t("common.inactive")}</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-xl border border-borderc px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/20"
            >
              {t("common.remove")}
            </button>
          )}
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-borderc bg-card p-12">
          <EmptyState
            title={hasActiveFilters ? t("offers.empty.filtered") : t("offers.empty.title")}
            description={
              hasActiveFilters ? t("offers.empty.filteredDescription") : t("offers.empty.subtitle")
            }
            icon={<Plus className="h-12 w-12 text-muted/30" />}
            ctaLabel={t("offers.create")}
            onClick={() => setShowCreateModal(true)}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-borderc bg-card shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderc px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("offers.listTitle")}</h2>
              <p className="text-sm text-muted">{t("offers.listSubtitle")}</p>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setShowBulkConfirm(true)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                {t("offers.bulk.confirm")}
              </button>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 border-b border-borderc bg-red-50 px-6 py-3 text-sm text-red-700">
              <span className="font-semibold">
                {t("offers.bulk.selected", { count: selectedIds.size })}
              </span>
              <span className="text-xs text-red-600">{t("offers.bulk.helper")}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                <tr>
                  <th className="px-6 py-3 w-[40px]">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-zuma-600 focus:ring-zuma-500 cursor-pointer"
                      checked={offers.length > 0 && selectedIds.size === offers.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 font-semibold">{t("offers.fields.brand")}</th>
                  <th className="px-6 py-3 font-semibold">{t("offers.fields.region")}</th>
                  <th className="px-6 py-3 font-semibold">{t("offers.fields.denomination")}</th>
                  <th className="px-6 py-3 font-semibold">{t("offers.fields.price")}</th>
                  <th className="px-6 py-3 font-semibold">{t("offers.fields.stock")}</th>
                  <th className="px-6 py-3 font-semibold">{t("offers.fields.status")}</th>
                  <th className="px-6 py-3 text-right font-semibold">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderc">
                {offers.map((offer) => (
                  <tr
                    key={offer.id}
                    className={`transition-colors hover:bg-muted/5 ${
                      selectedIds.has(offer.id) ? "bg-zuma-50/60" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-zuma-600 focus:ring-zuma-500 cursor-pointer"
                        checked={selectedIds.has(offer.id)}
                        onChange={() => toggleSelect(offer.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {offer.brand?.name || t("offers.fields.unknown")}
                    </td>
                    <td className="px-6 py-4">{offer.region?.name || offer.region_code}</td>
                    <td className="px-6 py-4">
                      {offer.denomination_value} {offer.denomination_currency}
                    </td>
                    <td className="px-6 py-4 font-semibold">{offer.price}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const info = stockLabel(offer.stock_quantity)
                        const toneClass =
                          info.tone === "success"
                            ? "bg-success-50 text-success-700"
                            : info.tone === "warning"
                            ? "bg-warning-50 text-warning-700"
                            : info.tone === "danger"
                            ? "bg-danger-50 text-danger-700"
                            : "bg-muted/30 text-muted"

                        return (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>
                              {info.label}
                            </span>
                            <span className="text-xs text-muted">
                              {offer.stock_quantity ?? "—"}
                            </span>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          offer.status === "active"
                            ? "bg-success-50 text-success-700"
                            : "bg-muted/30 text-muted"
                        }`}
                      >
                        {offer.status === "active" ? t("common.active") : t("common.inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/inventory?offer_id=${offer.id}`}
                          className="rounded-lg p-2 text-muted transition-colors hover:bg-muted/20 hover:text-foreground"
                          title={t("offers.actions.inventory")}
                        >
                          <span className="text-xs font-semibold">{t("offers.actions.inventoryShort")}</span>
                        </Link>
                        <button
                          onClick={() => toggleStatus(offer)}
                          className={`rounded-lg p-2 transition-colors ${
                            offer.status === "active"
                              ? "text-warning-700 hover:bg-warning-50"
                              : "text-success-700 hover:bg-success-50"
                          }`}
                          title={
                            offer.status === "active"
                              ? t("common.deactivate")
                              : t("common.activate")
                          }
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : offer.status === "active" ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(offer)}
                          className="rounded-lg p-2 text-zuma-600 transition-colors hover:bg-zuma-50"
                          title={t("common.edit")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(offer.id)}
                          className="rounded-lg p-2 text-danger-500 transition-colors hover:bg-danger-50"
                          title={t("common.delete")}
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
      )}
    </div>
  )
}
