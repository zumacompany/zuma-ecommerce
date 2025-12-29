"use client"
import { useEffect, useState } from 'react'
import { btnPrimary, btnSecondary, input } from '../ui/classes'
import EmptyState from './EmptyState'
import StatusBadge from './StatusBadge'

export default function PaymentMethodsAdmin() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any[] | null>(null)

  const [showCreate, setShowCreate] = useState(false)

  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'manual' | 'stripe' | 'mpesa'>('manual')
  const [newInstructions, setNewInstructions] = useState('')
  const [newNIB, setNewNIB] = useState('')
  const [newAccountName, setNewAccountName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active')
  const [newSortOrder, setNewSortOrder] = useState<number | ''>('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<'manual' | 'stripe' | 'mpesa'>('manual')
  const [editInstructions, setEditInstructions] = useState('')
  const [editNIB, setEditNIB] = useState('')
  const [editAccountName, setEditAccountName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')
  const [editSortOrder, setEditSortOrder] = useState<number | ''>('')

  async function fetchMethods() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/payment-methods')
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
    fetchMethods()

    // Realtime subscription: refresh list on any change
    let channel: any = null
    import('../../lib/supabase/browser').then(({ supabase }) => {
      if (!supabase || typeof (supabase as any).channel !== 'function') return
      channel = (supabase as any).channel('public:payment_methods')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_methods' }, () => {
          fetchMethods()
        })
        .subscribe()
    }).catch(() => { })

    return () => { if (channel && typeof channel.unsubscribe === 'function') channel.unsubscribe() }
  }, [])

  async function createMethod(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!newName || !newType) return setError('Missing required fields')
    const sortNum = newSortOrder === '' ? undefined : Number(newSortOrder)
    if (sortNum !== undefined && (isNaN(sortNum) || sortNum < 0)) return setError('Sort order must be a non-negative number')

    const details: any = {}
    if (newType === 'manual') {
      if (!newNIB || !newAccountName) return setError('Manual payment requires account fields')
      details.account_number = newNIB
      details.account_name = newAccountName
    }
    if (newType === 'mpesa') {
      if (!newPhone) return setError('Mpesa requires phone number')
      details.phone = newPhone
    }

    try {
      const body = { name: newName, type: newType, instructions_md: newInstructions, details, status: newStatus, sort_order: sortNum }
      const res = await fetch('/api/admin/payment-methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setShowCreate(false)
      setNewName('')
      setNewType('manual')
      setNewInstructions('')
      setNewNIB('')
      setNewAccountName('')
      setNewPhone('')
      setNewStatus('active')
      setNewSortOrder('')
      fetchMethods()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  function startEdit(m: any) {
    setEditingId(m.id)
    setEditName(m.name ?? '')
    setEditType(m.type ?? 'manual')
    setEditInstructions(m.instructions_md ?? '')
    setEditNIB(m.details?.account_number ?? '')
    setEditAccountName(m.details?.account_name ?? '')
    setEditPhone(m.details?.phone ?? '')
    setEditStatus(m.status ?? 'active')
    setEditSortOrder(m.sort_order ?? '')
  }

  function cancelEdit() { setEditingId(null) }

  async function saveEdit(id: string) {
    setError(null)
    if (!editName || !editType) return setError('Missing required fields')
    const sortNum = editSortOrder === '' ? undefined : Number(editSortOrder)
    if (sortNum !== undefined && (isNaN(sortNum) || sortNum < 0)) return setError('Sort order must be a non-negative number')

    const details: any = {}
    if (editType === 'manual') {
      if (!editNIB || !editAccountName) return setError('Manual payment requires account fields')
      details.account_number = editNIB
      details.account_name = editAccountName
    }
    if (editType === 'mpesa') {
      if (!editPhone) return setError('Mpesa requires phone number')
      details.phone = editPhone
    }

    try {
      const body: any = { name: editName, type: editType, instructions_md: editInstructions, details, status: editStatus }
      if (sortNum !== undefined) body.sort_order = sortNum
      const res = await fetch(`/api/admin/payment-methods/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      cancelEdit()
      fetchMethods()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    }
  }

  async function deleteMethod(id: string) {
    if (!confirm('Delete this payment method?')) return
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      fetchMethods()
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
        <h3 className="text-lg font-semibold">Payment methods</h3>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded bg-zuma-500 text-white" onClick={() => setShowCreate(s => !s)}>{showCreate ? 'Cancel' : 'Create method'}</button>
        </div>
      </div>

      {showCreate && (
        <section className="rounded-xl bg-card p-6 border border-borderc">
          <h4 className="text-md font-semibold">Create payment method</h4>
          <form className="mt-4 grid grid-cols-1 gap-3" onSubmit={createMethod}>
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <select className={input} value={newType} onChange={(e) => setNewType(e.target.value as any)}>
                <option value="manual">Manual</option>
                <option value="stripe">Stripe</option>
                <option value="mpesa">Mpesa</option>
              </select>
            </div>

            <textarea className={input} placeholder="Instructions (markdown)" value={newInstructions} onChange={(e) => setNewInstructions(e.target.value)} />

            {newType === 'manual' && (
              <div className="grid grid-cols-2 gap-2">
                <input className={input} placeholder="NIB / Account number" value={newNIB} onChange={(e) => setNewNIB(e.target.value)} />
                <input className={input} placeholder="Account name" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
              </div>
            )}

            {newType === 'mpesa' && (
              <input className={input} placeholder="Phone number (wallet)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            )}

            <div className="grid grid-cols-3 gap-2 items-center">
              <select className={input} value={newStatus} onChange={(e) => setNewStatus(e.target.value as any)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <input className={input} placeholder="Sort order" type="number" value={newSortOrder as any} onChange={(e) => setNewSortOrder(e.target.value === '' ? '' : Number(e.target.value))} />
              <div />
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
            <EmptyState title="No data — add at least one manual payment method." ctaLabel="Create method" onClick={() => setShowCreate(true)} />
          </div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Sort</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((m) => (
                  editingId === m.id ? (
                    <tr key={m.id} className="border-t border-borderc bg-zuma-50">
                      <td className="px-4 py-3">
                        <input className={input} value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </td>
                      <td className="px-4 py-3">
                        <select className={input} value={editType} onChange={(e) => setEditType(e.target.value as any)}>
                          <option value="manual">Manual</option>
                          <option value="stripe">Stripe</option>
                          <option value="mpesa">Mpesa</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select className={input} value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}><option value="active">Active</option><option value="inactive">Inactive</option></select>
                      </td>
                      <td className="px-4 py-3"><input className={input} type="number" value={editSortOrder as any} onChange={(e) => setEditSortOrder(e.target.value === '' ? '' : Number(e.target.value))} /></td>
                      <td className="px-4 py-3 flex gap-2"><button className={btnSecondary} onClick={() => saveEdit(m.id)}>Save</button><button className={btnSecondary} onClick={cancelEdit}>Cancel</button></td>
                    </tr>
                  ) : (
                    <tr key={m.id} className="border-t border-borderc">
                      <td className="px-4 py-3">{m.name}</td>
                      <td className="px-4 py-3">{m.type}</td>
                      <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                      <td className="px-4 py-3">{m.sort_order ?? '—'}</td>
                      <td className="px-4 py-3 flex gap-2"><button className={btnSecondary} onClick={() => startEdit(m)}>Edit</button><button className={btnSecondary} onClick={() => deleteMethod(m.id)}>Delete</button></td>
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
