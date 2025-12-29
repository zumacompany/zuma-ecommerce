"use client"
import { useEffect, useState } from 'react'
import { btnPrimary, btnSecondary, input } from '../ui/classes'
import EmptyState from './EmptyState'
import StatusBadge from './StatusBadge'

export default function OffersAdmin() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any[] | null>(null)
  const [brands, setBrands] = useState<any[] | null>(null)
  const [regions, setRegions] = useState<any[] | null>(null)

  const [filterBrand, setFilterBrand] = useState<string | null>(null)
  const [filterRegion, setFilterRegion] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [newBrand, setNewBrand] = useState<string | null>(null)
  const [newRegion, setNewRegion] = useState("")
  const [newDenomCurrency, setNewDenomCurrency] = useState('MZN')
  const [newDenomValue, setNewDenomValue] = useState<number | ''>('')
  const [newPrice, setNewPrice] = useState<number | ''>('')
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBrand, setEditBrand] = useState<string | null>(null)
  const [editRegion, setEditRegion] = useState<string>("")
  const [editDenomCurrency, setEditDenomCurrency] = useState('MZN')
  const [editDenomValue, setEditDenomValue] = useState<number | ''>('')
  const [editPrice, setEditPrice] = useState<number | ''>('')
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')

  async function fetchOffers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/offers')
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

  async function fetchBrands() {
    try {
      const res = await fetch('/api/admin/brands')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setBrands(json.data ?? [])
    } catch (err) {
      // non-fatal
    }
  }

  async function fetchRegions() {
    try {
      const res = await fetch('/api/admin/regions')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setRegions(json.data ?? [])
    } catch (err) {
      // non-fatal
    }
  }

  useEffect(() => {
    fetchOffers(); fetchBrands(); fetchRegions()

    // Realtime subscription: refresh list on any change
    let channel: any = null
    import('../../lib/supabase/browser').then(({ supabase }) => {
      if (!supabase || typeof (supabase as any).channel !== 'function') return
      channel = (supabase as any).channel('public:offers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
          fetchOffers()
        })
        .subscribe()
    }).catch(() => { })

    return () => { if (channel && typeof channel.unsubscribe === 'function') channel.unsubscribe() }
  }, [])

  function applyFilters(list: any[]) {
    return list.filter((o) => {
      if (filterBrand && o.brand?.id !== filterBrand) return false
      if (filterRegion && (!o.region_code || !o.region_code.includes(filterRegion))) return false
      if (filterStatus && o.status !== filterStatus) return false
      return true
    })
  }

  async function createOffer(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!newBrand || !newRegion || !newDenomCurrency) return setError('Missing required fields')
    const denomNum = Number(newDenomValue)
    const priceNum = Number(newPrice)
    if (isNaN(denomNum) || denomNum <= 0) return setError('Denomination value must be > 0')
    if (isNaN(priceNum) || priceNum <= 0) return setError('Price must be > 0')

    try {
      const body = { brand_id: newBrand, region_code: newRegion, denomination_currency: newDenomCurrency, denomination_value: denomNum, price: priceNum, status: newStatus }
      const res = await fetch('/api/admin/offers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setShowCreate(false)
      setNewBrand(null)
      setNewRegion('')
      setNewDenomValue('')
      setNewPrice('')
      fetchOffers()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  function startEdit(o: any) {
    setEditingId(o.id)
    setEditBrand(o.brand?.id ?? null)
    setEditRegion(o.region_code ?? '')
    setEditDenomCurrency(o.denomination_currency ?? 'MZN')
    setEditDenomValue(o.denomination_value ?? '')
    setEditPrice(o.price ?? '')
    setEditStatus(o.status ?? 'active')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    try {
      const denomNum = Number(editDenomValue)
      const priceNum = Number(editPrice)
      if (isNaN(denomNum) || denomNum <= 0) return setError('Denomination value must be > 0')
      if (isNaN(priceNum) || priceNum <= 0) return setError('Price must be > 0')

      const body: any = { brand_id: editBrand, region_code: editRegion, denomination_currency: editDenomCurrency, denomination_value: denomNum, price: priceNum, status: editStatus }
      const res = await fetch(`/api/admin/offers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      cancelEdit()
      fetchOffers()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  async function toggleStatus(id: string, current: string) {
    try {
      const next = current === 'active' ? 'inactive' : 'active'
      const res = await fetch(`/api/admin/offers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      fetchOffers()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  async function deleteOffer(id: string) {
    if (!confirm('Delete this offer?')) return
    try {
      const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      fetchOffers()
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

  const filtered = applyFilters(data ?? [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Offers</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <select className={input} value={filterBrand ?? ''} onChange={(e) => setFilterBrand(e.target.value || null)}>
              <option value="">All brands</option>
              {(brands ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className={input} value={filterRegion ?? ''} onChange={(e) => setFilterRegion(e.target.value || null)}>
              <option value="">All regions</option>
              {(regions ?? []).map(r => <option key={r.id} value={r.code}>{r.name} ({r.code})</option>)}
            </select>
            <select className={input} value={filterStatus ?? ''} onChange={(e) => setFilterStatus(e.target.value || null)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button className="px-3 py-1 rounded bg-zuma-500 text-white" onClick={() => setShowCreate(s => !s)}>{showCreate ? 'Cancel' : 'Create offer'}</button>
        </div>
      </div>

      {showCreate && (
        <section className="rounded-xl bg-card p-6 border border-borderc">
          <h4 className="text-md font-semibold">Create offer</h4>
          <form className="mt-4 grid grid-cols-1 gap-3" onSubmit={createOffer}>
            <div className="grid grid-cols-2 gap-2">
              <select className={input} value={newBrand ?? ''} onChange={(e) => setNewBrand(e.target.value)}>
                <option value="">Select brand</option>
                {(brands ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select className={input} value={newRegion} onChange={(e) => setNewRegion(e.target.value)}>
                <option value="">Select region</option>
                {(regions ?? []).map(r => <option key={r.id} value={r.code}>{r.name} ({r.code})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input className={input} placeholder="Denomination currency" value={newDenomCurrency} onChange={(e) => setNewDenomCurrency(e.target.value)} />
              <input className={input} placeholder="Denomination value" type="number" value={newDenomValue as any} onChange={(e) => setNewDenomValue(e.target.value === '' ? '' : Number(e.target.value))} />
              <input className={input} placeholder="Price" type="number" value={newPrice as any} onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))} />
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

        {(!filtered || filtered.length === 0) ? (
          <div className="mt-3">
            <EmptyState title="No data — create offers for brands." ctaLabel="Create offer" onClick={() => setShowCreate(true)} />
          </div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-semibold">Brand</th>
                  <th className="px-4 py-3 font-semibold">Region</th>
                  <th className="px-4 py-3 font-semibold">Denomination</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  editingId === o.id ? (
                    <tr key={o.id} className="border-t border-borderc bg-zuma-50">
                      <td className="px-4 py-3">
                        <select className={input} value={editBrand ?? ''} onChange={(e) => setEditBrand(e.target.value)}>
                          {(brands ?? []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select className={input} value={editRegion} onChange={(e) => setEditRegion(e.target.value)}>
                          <option value="">Select region</option>
                          {(regions ?? []).map(r => <option key={r.id} value={r.code}>{r.name} ({r.code})</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <input className={input} value={editDenomCurrency} onChange={(e) => setEditDenomCurrency(e.target.value)} />
                          <input className={input} type="number" value={editDenomValue as any} onChange={(e) => setEditDenomValue(e.target.value === '' ? '' : Number(e.target.value))} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><input className={input} type="number" value={editPrice as any} onChange={(e) => setEditPrice(e.target.value === '' ? '' : Number(e.target.value))} /></td>
                      <td className="px-4 py-3"><select className={input} value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}><option value="active">Active</option><option value="inactive">Inactive</option></select></td>
                      <td className="px-4 py-3 flex gap-2"><button className={btnSecondary} onClick={() => saveEdit(o.id)}>Save</button><button className={btnSecondary} onClick={cancelEdit}>Cancel</button></td>
                    </tr>
                  ) : (
                    <tr key={o.id} className="border-t border-borderc">
                      <td className="px-4 py-3">{o.brand?.name ?? 'No data'}</td>
                      <td className="px-4 py-3">{o.region_code ?? 'No data'}</td>
                      <td className="px-4 py-3">{o.denomination_value ?? 'No data'} {o.denomination_currency ?? ''}</td>
                      <td className="px-4 py-3">{o.price ?? 'No data'}</td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 flex gap-2"><button className={btnSecondary} onClick={() => startEdit(o)}>Edit</button><button className={btnSecondary} onClick={() => toggleStatus(o.id, o.status)}>{o.status === 'active' ? 'Deactivate' : 'Activate'}</button></td>
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