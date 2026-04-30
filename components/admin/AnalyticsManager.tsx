"use client"

import { useMemo, useState } from "react"
import { Plus, Edit2, Trash2, Save, X, Loader2, RefreshCw, Activity } from "lucide-react"
import ConfirmationModal from "./ConfirmationModal"
import EmptyState from "./EmptyState"

type AnalyticsEvent = {
  id: string
  event_name: string
  session_id: string | null
  order_id: string | null
  metadata: any
  created_at: string
}

const emptyForm = {
  event_name: "",
  session_id: "",
  order_id: "",
  metadata: "{}"
}

export default function AnalyticsManager({ initialEvents }: { initialEvents: AnalyticsEvent[] }) {
  const [events, setEvents] = useState<AnalyticsEvent[]>(initialEvents)
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return events
    return events.filter((ev) =>
      ev.event_name.toLowerCase().includes(term) ||
      (ev.session_id || "").toLowerCase().includes(term) ||
      (ev.order_id || "").toLowerCase().includes(term)
    )
  }, [events, search])

  async function refreshEvents() {
    setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/analytics?limit=200')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch analytics events')
      setEvents(json.data || [])
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    } finally {
      setRefreshing(false)
    }
  }

  function openCreate() {
    setForm({ ...emptyForm })
    setShowCreate(true)
    setEditingId(null)
    setError(null)
  }

  function openEdit(ev: AnalyticsEvent) {
    setForm({
      event_name: ev.event_name || "",
      session_id: ev.session_id || "",
      order_id: ev.order_id || "",
      metadata: ev.metadata ? JSON.stringify(ev.metadata, null, 2) : "{}"
    })
    setEditingId(ev.id)
    setShowCreate(false)
    setError(null)
  }

  function closeEditor() {
    setForm({ ...emptyForm })
    setEditingId(null)
    setShowCreate(false)
  }

  function parseMetadata(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) return null
    return JSON.parse(trimmed)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const payload = {
        event_name: form.event_name.trim(),
        session_id: form.session_id.trim() || null,
        order_id: form.order_id.trim() || null,
        metadata: parseMetadata(form.metadata)
      }
      if (!payload.event_name) throw new Error('event_name is required')
      const res = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create event')
      closeEditor()
      await refreshEvents()
    } catch (err: any) {
      setError(err?.message ?? 'invalid metadata JSON')
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        event_name: form.event_name.trim(),
        session_id: form.session_id.trim() || null,
        order_id: form.order_id.trim() || null,
        metadata: parseMetadata(form.metadata)
      }
      if (!payload.event_name) throw new Error('event_name is required')
      const res = await fetch(`/api/admin/analytics/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update event')
      closeEditor()
      await refreshEvents()
    } catch (err: any) {
      setError(err?.message ?? 'invalid metadata JSON')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/analytics/${deleteId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete event')
      setDeleteId(null)
      await refreshEvents()
    } catch (err: any) {
      setError(err?.message ?? 'unknown')
    } finally {
      setSaving(false)
    }
  }

  const eventToDelete = events.find(e => e.id === deleteId)

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        description={`Delete event "${eventToDelete?.event_name}"? This cannot be undone.`}
        confirmText="Delete Event"
        isDestructive={true}
        loading={saving}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Analytics Events</h2>
          <p className="text-sm text-muted">Inspect and manage event logs stored in Supabase.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshEvents}
            disabled={refreshing}
            className="px-3 py-2 rounded-lg border border-borderc text-sm font-semibold flex items-center gap-2 hover:bg-muted/10 disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="px-3 py-2 rounded-lg bg-zuma-500 text-white text-sm font-semibold flex items-center gap-2 hover:bg-zuma-600"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {(showCreate || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="rounded-2xl border border-borderc bg-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted" />
              {editingId ? 'Edit Event' : 'Create Event'}
            </h3>
            <button
              type="button"
              onClick={closeEditor}
              className="p-2 rounded-lg hover:bg-muted/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="px-3 py-2 rounded-lg border border-borderc bg-background"
              placeholder="event_name"
              value={form.event_name}
              onChange={(e) => setForm(prev => ({ ...prev, event_name: e.target.value }))}
            />
            <input
              className="px-3 py-2 rounded-lg border border-borderc bg-background"
              placeholder="session_id (optional)"
              value={form.session_id}
              onChange={(e) => setForm(prev => ({ ...prev, session_id: e.target.value }))}
            />
            <input
              className="px-3 py-2 rounded-lg border border-borderc bg-background"
              placeholder="order_id (optional)"
              value={form.order_id}
              onChange={(e) => setForm(prev => ({ ...prev, order_id: e.target.value }))}
            />
          </div>

          <textarea
            className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-borderc bg-background font-mono text-xs"
            placeholder='Metadata JSON (e.g. {"path":"/","value":123})'
            value={form.metadata}
            onChange={(e) => setForm(prev => ({ ...prev, metadata: e.target.value }))}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeEditor}
              className="px-4 py-2 rounded-lg border border-borderc text-sm font-semibold flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || saving}
              className="px-4 py-2 rounded-lg bg-zuma-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {(creating || saving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-borderc bg-card overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-b border-borderc">
          <div className="text-sm font-semibold">Events</div>
          <input
            className="px-3 py-2 rounded-lg border border-borderc bg-background text-sm"
            placeholder="Search event, session, order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No events"
              description="Analytics events will appear here as users navigate the site."
              icon={<Activity className="w-12 h-12 text-muted/30" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/30 text-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Event</th>
                  <th className="text-left px-4 py-3 font-semibold">Session</th>
                  <th className="text-left px-4 py-3 font-semibold">Order</th>
                  <th className="text-left px-4 py-3 font-semibold">Created</th>
                  <th className="text-left px-4 py-3 font-semibold">Metadata</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderc">
                {filteredEvents.map((ev) => {
                  const metaText = ev.metadata ? JSON.stringify(ev.metadata) : ''
                  return (
                    <tr key={ev.id} className="hover:bg-muted/5">
                      <td className="px-4 py-3 font-medium text-foreground">{ev.event_name}</td>
                      <td className="px-4 py-3 text-muted">{ev.session_id || '-'}</td>
                      <td className="px-4 py-3 text-muted">{ev.order_id || '-'}</td>
                      <td className="px-4 py-3 text-muted">{new Date(ev.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted">
                        {metaText ? (metaText.length > 80 ? `${metaText.slice(0, 80)}...` : metaText) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(ev)}
                            className="px-2 py-1 rounded-lg border border-borderc text-xs font-semibold hover:bg-muted/10 inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(ev.id)}
                            className="px-2 py-1 rounded-lg border border-borderc text-xs font-semibold text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
