"use client";
import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary, input } from "../ui/classes";
import EmptyState from "./EmptyState";

type Category = { id: string; name: string; slug: string };

export default function CategoriesAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Category[] | null>(null);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.data ?? [])
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  async function createCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newName || !newSlug) return
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, slug: newSlug })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setNewName('')
      setNewSlug('')
      fetchCategories()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditSlug(c.slug)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditSlug('')
  }

  async function saveEdit(id: string) {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, slug: editSlug })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      cancelEdit()
      fetchCategories()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category?')) return
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      fetchCategories()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  if (loading) return <div className="rounded-xl bg-card p-6 border border-borderc">Loading...</div>
  if (error) return (
    <div className="rounded-xl bg-card p-6 border border-borderc">
      <h3 className="text-lg font-semibold">Error</h3>
      <p className="mt-2 text-sm text-muted">{error}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Create category</h3>
        <form className="mt-4 flex gap-2" onSubmit={createCategory}>
          <input className={input} placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className={input} placeholder="Slug (unique)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
          <button className={btnPrimary} type="submit">Create</button>
        </form>
      </section>

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h3 className="text-lg font-semibold">Categories</h3>
        {(!data || data.length === 0) ? (
          <div className="mt-3">
            <EmptyState title="No data — create categories." ctaLabel="Create category" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {data.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 border border-borderc rounded-lg p-3">
                <div>
                  {editingId === c.id ? (
                    <div className="flex gap-2">
                      <input className={input} value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <input className={input} value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-muted">{c.slug}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId === c.id ? (
                    <>
                      <button className={btnSecondary} onClick={() => saveEdit(c.id)}>Save</button>
                      <button className={btnSecondary} onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className={btnSecondary} onClick={() => startEdit(c)}>Edit</button>
                      <button className={btnSecondary} onClick={() => deleteCategory(c.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
