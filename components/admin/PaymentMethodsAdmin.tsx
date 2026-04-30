"use client";
import { useEffect, useState } from "react";
import { btnPrimary, btnSecondary, input } from "../ui/classes";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import { useI18n } from "../../lib/i18n";

export default function PaymentMethodsAdmin() {
  const { t } = useI18n()
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
    if (!newName || !newType) return setError(t('payments.messages.missingFields'))
    const sortNum = newSortOrder === '' ? undefined : Number(newSortOrder)
    if (sortNum !== undefined && (isNaN(sortNum) || sortNum < 0)) return setError(t('payments.messages.sortOrderError'))

    const details: any = {}
    if (newType === 'manual') {
      if (!newNIB || !newAccountName) return setError(t('payments.messages.manualFieldsRequired'))
      details.account_number = newNIB
      details.account_name = newAccountName
    }
    if (newType === 'mpesa') {
      if (!newPhone) return setError(t('payments.messages.mpesaFieldsRequired'))
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
    if (!editName || !editType) return setError(t('payments.messages.missingFields'))
    const sortNum = editSortOrder === '' ? undefined : Number(editSortOrder)
    if (sortNum !== undefined && (isNaN(sortNum) || sortNum < 0)) return setError(t('payments.messages.sortOrderError'))

    const details: any = {}
    if (editType === 'manual') {
      if (!editNIB || !editAccountName) return setError(t('payments.messages.manualFieldsRequired'))
      details.account_number = editNIB
      details.account_name = editAccountName
    }
    if (editType === 'mpesa') {
      if (!editPhone) return setError(t('payments.messages.mpesaFieldsRequired'))
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
    if (!confirm(t('payments.messages.deleteConfirm'))) return
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
    <div className="rounded-xl bg-card p-6 border border-borderc text-red-600">
      <h3 className="text-lg font-semibold">Error</h3>
      <p className="mt-2 text-sm">{error}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('payments.title')}</h3>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded bg-zuma-500 text-white flex items-center gap-2"
            onClick={() => setShowCreate(s => !s)}
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? t('common.cancel') : t('payments.createMethod')}
          </button>
        </div>
      </div>

      {showCreate && (
        <section className="rounded-xl bg-card p-6 border border-borderc">
          <h4 className="text-md font-semibold">{t('payments.createMethod')}</h4>
          <form className="mt-4 grid grid-cols-1 gap-3" onSubmit={createMethod}>
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder={t('payments.placeholder.name')} value={newName} onChange={(e) => setNewName(e.target.value)} />
              <select className={input} value={newType} onChange={(e) => setNewType(e.target.value as any)}>
                <option value="manual">{t('payments.types.manual')}</option>
                <option value="stripe">{t('payments.types.stripe')}</option>
                <option value="mpesa">{t('payments.types.mpesa')}</option>
              </select>
            </div>

            <textarea className={input} placeholder={t('payments.placeholder.instructions')} value={newInstructions} onChange={(e) => setNewInstructions(e.target.value)} />

            {newType === 'manual' && (
              <div className="grid grid-cols-2 gap-2">
                <input className={input} placeholder={t('payments.placeholder.nib')} value={newNIB} onChange={(e) => setNewNIB(e.target.value)} />
                <input className={input} placeholder={t('payments.placeholder.accountName')} value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
              </div>
            )}

            {newType === 'mpesa' && (
              <input className={input} placeholder={t('payments.placeholder.phone')} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            )}

            <div className="grid grid-cols-3 gap-2 items-center">
              <select className={input} value={newStatus} onChange={(e) => setNewStatus(e.target.value as any)}>
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
              </select>
              <input className={input} placeholder={t('payments.placeholder.sort')} type="number" value={newSortOrder as any} onChange={(e) => setNewSortOrder(e.target.value === '' ? '' : Number(e.target.value))} />
              <div />
            </div>

            <div>
              <button className={`${btnPrimary} inline-flex items-center gap-2`} type="submit">
                <Plus className="w-4 h-4" />
                {t('common.create')}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl bg-card p-6 border border-borderc">
        <h4 className="text-md font-semibold">{t('payments.list')}</h4>

        {(!data || data.length === 0) ? (
          <div className="mt-3">
            <EmptyState title={t('common.noResultsFound')} ctaLabel={t('payments.createMethod')} onClick={() => setShowCreate(true)} />
          </div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('payments.name')}</th>
                  <th className="px-4 py-3 font-semibold">{t('payments.type')}</th>
                  <th className="px-4 py-3 font-semibold">{t('payments.status')}</th>
                  <th className="px-4 py-3 font-semibold">{t('payments.sort')}</th>
                  <th className="px-4 py-3 font-semibold">{t('payments.actions')}</th>
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
                          <option value="manual">{t('payments.types.manual')}</option>
                          <option value="stripe">{t('payments.types.stripe')}</option>
                          <option value="mpesa">{t('payments.types.mpesa')}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select className={input} value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                          <option value="active">{t('common.active')}</option>
                          <option value="inactive">{t('common.inactive')}</option>
                        </select>
                      </td>
                      <td className="px-4 py-3"><input className={input} type="number" value={editSortOrder as any} onChange={(e) => setEditSortOrder(e.target.value === '' ? '' : Number(e.target.value))} /></td>
                      <td className="px-4 py-3 flex gap-2">
                        <button className={`${btnSecondary} inline-flex items-center gap-2`} onClick={() => saveEdit(m.id)}>
                          <Save className="w-4 h-4" />
                          {t('common.save')}
                        </button>
                        <button className={`${btnSecondary} inline-flex items-center gap-2`} onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                          {t('common.cancel')}
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={m.id} className="border-t border-borderc hover:bg-muted/5">
                      <td className="px-4 py-3">{m.name}</td>
                      <td className="px-4 py-3">{t(`payments.types.${m.type}`)}</td>
                      <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                      <td className="px-4 py-3">{m.sort_order ?? '—'}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button className={`${btnSecondary} inline-flex items-center gap-2`} onClick={() => startEdit(m)}>
                          <Edit2 className="w-4 h-4" />
                          {t('common.edit')}
                        </button>
                        <button className={`${btnSecondary} inline-flex items-center gap-2 text-red-600 hover:text-red-700`} onClick={() => deleteMethod(m.id)}>
                          <Trash2 className="w-4 h-4" />
                          {t('common.delete')}
                        </button>
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
