"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Trash2, X, Check, Globe, ExternalLink } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"
import CatalogFlowBar from "./CatalogFlowBar"
import { useI18n } from "../../lib/i18n"
import { btnPrimary, input, label } from "../ui/classes"

type Region = {
  id: string
  name: string
  code: string
  created_at: string
}

export default function RegionsManager({ initialRegions }: { initialRegions: Region[] }) {
  const router = useRouter()
  const { t } = useI18n()
  const [regions, setRegions] = useState(initialRegions)

  const [newName, setNewName] = useState("")
  const [newCode, setNewCode] = useState("")
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editCode, setEditCode] = useState("")
  const [updating, setUpdating] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newCode.trim()) return

    setCreating(true)
    try {
      const res = await fetch("/api/admin/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          code: newCode.trim().toUpperCase(),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")

      if (json.data) {
        setRegions((prev) =>
          [...prev, json.data].sort((a, b) => a.name.localeCompare(b.name))
        )
      }

      setNewName("")
      setNewCode("")
      router.refresh()
    } catch (err: any) {
      alert(`${t("regions.messages.createError")}: ${err.message}`)
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
    setEditName("")
    setEditCode("")
  }

  async function handleUpdate() {
    if (!editingId || !editName.trim() || !editCode.trim()) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/regions/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")

      if (json.data) {
        setRegions((prev) =>
          prev
            .map((r) => (r.id === editingId ? json.data : r))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      }

      cancelEdit()
      router.refresh()
    } catch (err: any) {
      alert(`${t("regions.messages.updateError")}: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/regions/${deleteId}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")

      setRegions((prev) => prev.filter((r) => r.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } catch (err: any) {
      alert(`${t("regions.messages.deleteError")}: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const regionToDelete = regions.find((r) => r.id === deleteId)

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("regions.delete.title")}
        description={t("regions.delete.description", { name: regionToDelete?.name || "" })}
        confirmText={t("regions.delete.confirm")}
        isDestructive={true}
        loading={deleting}
      />

      <CatalogFlowBar current="regions" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {t("nav.regions")}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{t("regions.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("regions.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-borderc bg-card p-5 shadow-card"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              {t("regions.newTitle")}
            </p>
            <h2 className="text-lg font-semibold text-foreground">
              {t("regions.newSubtitle")}
            </h2>
          </div>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className={label}>{t("regions.fields.name")}</label>
              <input
                type="text"
                placeholder={t("regions.placeholders.name")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={input}
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <label className={label}>{t("regions.fields.code")}</label>
              <input
                type="text"
                placeholder={t("regions.placeholders.code")}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className={input}
                disabled={creating}
                maxLength={3}
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newName.trim() || !newCode.trim()}
              className={`${btnPrimary} gap-2`}
            >
              <Plus className="h-4 w-4" />
              {creating ? t("common.processing") : t("common.create")}
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-borderc bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-borderc px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("regions.listTitle")}
              </h2>
              <p className="text-sm text-muted">{t("regions.listSubtitle")}</p>
            </div>
            <span className="rounded-full border border-borderc bg-muted/10 px-3 py-1 text-xs font-semibold text-muted">
              {regions.length}
            </span>
          </div>

          {regions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title={t("regions.empty.title")}
                description={t("regions.empty.subtitle")}
                icon={<Globe className="h-12 w-12 text-muted/30" />}
              />
            </div>
          ) : (
            <div className="divide-y divide-borderc">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className="flex flex-col gap-3 px-6 py-4 transition hover:bg-muted/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  {editingId === region.id ? (
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={input}
                        disabled={updating}
                        placeholder={t("regions.fields.name")}
                      />
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        className={input}
                        disabled={updating}
                        placeholder={t("regions.fields.code")}
                        maxLength={3}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleUpdate}
                          disabled={updating || !editName.trim() || !editCode.trim()}
                          className="rounded-lg p-2 text-success-700 transition hover:bg-success-50 disabled:opacity-50"
                          title={t("common.save")}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={updating}
                          className="rounded-lg p-2 text-muted transition hover:bg-muted/20"
                          title={t("common.cancel")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zuma-50 text-zuma-600">
                          <Globe className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{region.name}</div>
                          <div className="text-xs text-muted">{region.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/offers?region=${region.code}`}
                          className="rounded-lg p-2 text-zuma-600 transition hover:bg-zuma-50"
                          title={t("common.viewOffers")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(region)}
                          className="rounded-lg p-2 text-zuma-600 transition hover:bg-zuma-50"
                          title={t("common.edit")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(region.id)}
                          className="rounded-lg p-2 text-danger-500 transition hover:bg-danger-50"
                          title={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
