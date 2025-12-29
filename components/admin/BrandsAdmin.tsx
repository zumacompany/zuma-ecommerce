"use client"
import { useEffect, useState } from "react"
import { btnPrimary, btnSecondary, input } from "../ui/classes"
import EmptyState from "./EmptyState"
import StatusBadge from "./StatusBadge"

type Brand = { id: string; name: string; slug: string }

export default function BrandsAdmin() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Brand[] | null>(null)

  const [categories, setCategories] = useState<Array<{ id: string; name: string }> | null>(null)

  // create form state
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [newCategory, setNewCategory] = useState<string | null>(null)
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)
  const [newHeroFile, setNewHeroFile] = useState<File | null>(null)
  const [newDescription, setNewDescription] = useState("")
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editCategory, setEditCategory] = useState<string | null>(null)
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [editHeroFile, setEditHeroFile] = useState<File | null>(null)
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')

  async function fetchBrands() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/brands')
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

  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/categories')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setCategories(json.data ?? [])
    } catch (err) {
      // non-fatal
    }
  }

  useEffect(() => {
    fetchBrands(); fetchCategories()

    // Realtime subscription: refresh list on any change
    let channel: any = null
    import('../../lib/supabase/browser').then(({ supabase }) => {
      if (!supabase || typeof (supabase as any).channel !== 'function') return
      channel = (supabase as any).channel('public:brands')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
          fetchBrands()
        })
        .subscribe()
    }).catch(() => { })

    return () => { if (channel && typeof channel.unsubscribe === 'function') channel.unsubscribe() }
  }, [])

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function uploadFile(file: File | null) {
    if (!file) return null
    try {
      const { supabase } = await import('../../lib/supabase/browser')
      const filePath = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('public-assets').upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(filePath)
      return urlData.publicUrl
    } catch (err) {
      console.error('upload failed', err)
      return null
    }
  }

  async function createBrand(e: React.FormEvent) {
    e.preventDefault()
    if (!newName || !newSlug || !newCategory) return
    try {
      let logo = null
      let hero = null
      if (newLogoFile) {
        logo = await uploadFile(newLogoFile)
      }
      if (newHeroFile) {
        hero = await uploadFile(newHeroFile)
      }

      const body = { name: newName, slug: newSlug, category_id: newCategory, logo_path: logo, hero_image_path: hero, description_md: newDescription, status: newStatus }
      const res = await fetch('/api/admin/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setNewName('')
      setNewSlug('')
      setNewCategory(null)
      setNewLogoFile(null)
      setNewHeroFile(null)
      setNewDescription('')
      setNewStatus('active')
      setShowCreate(false)
      fetchBrands()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  function startEdit(b: any) {
    setEditingId(b.id)
    setEditName(b.name)
    setEditSlug(b.slug)
    setEditCategory(b.category?.id ?? null)
    setEditDescription(b.description_md ?? '')
    setEditStatus(b.status ?? 'active')
    setEditLogoFile(null)
    setEditHeroFile(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditSlug('')
    setEditCategory(null)
    setEditDescription('')
    setEditStatus('active')
    setEditLogoFile(null)
    setEditHeroFile(null)
  }

  async function saveEdit(id: string) {
    try {
      // If new files selected, upload them first
      let logoUrl = undefined
      let heroUrl = undefined
      if (editLogoFile) {
        logoUrl = await uploadFile(editLogoFile)
      }
      if (editHeroFile) {
        heroUrl = await uploadFile(editHeroFile)
      }

      const body: any = { name: editName, slug: editSlug }
      if (editCategory) body.category_id = editCategory
      if (logoUrl !== undefined) body.logo_path = logoUrl
      if (heroUrl !== undefined) body.hero_image_path = heroUrl
      if (editDescription !== undefined) body.description_md = editDescription
      if (editStatus) body.status = editStatus

      const res = await fetch(`/api/admin/brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      cancelEdit()
      fetchBrands()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  async function toggleStatus(id: string, current: string) {
    try {
      const next = current === 'active' ? 'inactive' : 'active'
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      fetchBrands()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  async function deleteBrand(id: string) {
    if (!confirm('Delete this brand?')) return
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      fetchBrands()
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Brands</h3>
        <div>
          <button className="px-3 py-1 rounded bg-zuma-500 text-white" onClick={() => setShowCreate(s => !s)}>{showCreate ? 'Cancel' : 'Create brand'}</button>
        </div>
      </div>

      {showCreate && (
        <section className="rounded-xl bg-card p-6 border border-borderc">
          <h4 className="text-md font-semibold">Create brand</h4>
          <form className="mt-4 grid grid-cols-1 gap-3" onSubmit={createBrand}>
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="Name" value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)) }} />
              <input className={input} placeholder="Slug (unique)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
            </div>

            <div>
              <label className="text-sm text-muted">Category</label>
              <select className={input} value={newCategory ?? ''} onChange={(e) => setNewCategory(e.target.value)}>
                <option value="">Select category</option>
                {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-muted">Logo</label>
                <input type="file" onChange={(e) => setNewLogoFile(e.target.files ? e.target.files[0] : null)} />
                <div className="text-xs text-muted">{newLogoFile ? newLogoFile.name : 'No data'}</div>
              </div>
              <div>
                <label className="text-sm text-muted">Hero image</label>
                <input type="file" onChange={(e) => setNewHeroFile(e.target.files ? e.target.files[0] : null)} />
                <div className="text-xs text-muted">{newHeroFile ? newHeroFile.name : 'No data'}</div>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted">Description (Markdown)</label>
              <textarea className="w-full rounded-lg border border-borderc p-2" rows={4} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              <div className="text-xs text-muted">{newDescription ? `${newDescription.length} chars` : 'No data'}</div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">Status</label>
              <select className={input} value={newStatus} onChange={(e) => setNewStatus(e.target.value as any)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <button className={btnPrimary} type="submit">Create</button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h4 className="text-md font-semibold">List</h4>

        {(!data || data.length === 0) ? (
          <div className="mt-3">
            <EmptyState title="No data — create your first brand." ctaLabel="Create brand" onClick={() => setShowCreate(true)} />
          </div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-semibold">Logo</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b: any) => (
                  editingId === b.id ? (
                    <tr key={b.id} className="border-t border-borderc bg-zuma-50">
                      <td className="px-4 py-3">
                        {(editLogoFile) ? (
                          <div className="text-xs">{editLogoFile.name}</div>
                        ) : (b.logo_path ? <img src={b.logo_path} alt={b.name} className="h-10 w-10 object-cover rounded" /> : <div className="text-xs text-muted">No data</div>)}
                        <div className="mt-2"><input type="file" onChange={(e) => setEditLogoFile(e.target.files ? e.target.files[0] : null)} /></div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="grid gap-1">
                          <input className={input} value={editName} onChange={(e) => { setEditName(e.target.value); setEditSlug(slugify(e.target.value)) }} />
                          <input className={input} value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
                          <select className={input} value={editCategory ?? ''} onChange={(e) => setEditCategory(e.target.value)}>
                            <option value="">Select category</option>
                            {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <textarea className="w-full rounded-lg border border-borderc p-2" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                          <div className="text-xs text-muted">{editDescription ? `${editDescription.length} chars` : 'No data'}</div>
                        </div>
                      </td>

                      <td className="px-4 py-3">{categories?.find(c => c.id === editCategory)?.name ?? (b.category?.name ?? 'No data')}</td>

                      <td className="px-4 py-3">
                        <select className={input} value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <div className="mt-2">
                          <input type="file" onChange={(e) => setEditHeroFile(e.target.files ? e.target.files[0] : null)} />
                          <div className="text-xs text-muted">{editHeroFile ? editHeroFile.name : (b.hero_image_path ? 'Has image' : 'No data')}</div>
                        </div>
                      </td>

                      <td className="px-4 py-3 flex gap-2">
                        <button className={btnSecondary} onClick={() => saveEdit(b.id)}>Save</button>
                        <button className={btnSecondary} onClick={cancelEdit}>Cancel</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={b.id} className="border-t border-borderc">
                      <td className="px-4 py-3">{b.logo_path ? <img src={b.logo_path} alt={b.name} className="h-10 w-10 object-cover rounded" /> : <div className="text-xs text-muted">No data</div>}</td>
                      <td className="px-4 py-3">{b.name}<div className="text-sm text-muted">{b.slug}</div></td>
                      <td className="px-4 py-3">{b.category?.name ?? 'No data'}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 flex gap-2">
                        <button className={btnSecondary} onClick={() => startEdit(b)}>Edit</button>
                        <button className={btnSecondary} onClick={() => toggleStatus(b.id, b.status)}>{b.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
