"use client"
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TimeRangePicker() {
  const router = useRouter()
  const params = useSearchParams()
  const preset = params?.get('preset') ?? '7d'
  const startParam = params?.get('start') ?? ''
  const endParam = params?.get('end') ?? ''

  const [localPreset, setLocalPreset] = useState(preset)
  const [start, setStart] = useState(startParam)
  const [end, setEnd] = useState(endParam)

  function apply() {
    const sp = new URLSearchParams(Array.from(params ?? []) as any)
    if (localPreset === 'custom') {
      if (start) sp.set('start', start)
      if (end) sp.set('end', end)
      sp.set('preset', 'custom')
    } else {
      sp.set('preset', localPreset)
      sp.delete('start')
      sp.delete('end')
    }
    const q = sp.toString()
    router.push(`/admin${q ? '?' + q : ''}`)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <button className={`px-3 py-1 rounded ${localPreset==='24h' ? 'bg-zuma-100' : 'hover:bg-zuma-50'}`} onClick={() => setLocalPreset('24h')}>24h</button>
        <button className={`px-3 py-1 rounded ${localPreset==='7d' ? 'bg-zuma-100' : 'hover:bg-zuma-50'}`} onClick={() => setLocalPreset('7d')}>7d</button>
        <button className={`px-3 py-1 rounded ${localPreset==='30d' ? 'bg-zuma-100' : 'hover:bg-zuma-50'}`} onClick={() => setLocalPreset('30d')}>30d</button>
        <button className={`px-3 py-1 rounded ${localPreset==='all' ? 'bg-zuma-100' : 'hover:bg-zuma-50'}`} onClick={() => setLocalPreset('all')}>All</button>
        <button className={`px-3 py-1 rounded ${localPreset==='custom' ? 'bg-zuma-100' : 'hover:bg-zuma-50'}`} onClick={() => setLocalPreset('custom')}>Custom</button>
      </div>

      {localPreset === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="date" className="border border-borderc rounded px-2 py-1" value={start} onChange={(e) => setStart(e.target.value)} />
          <span className="text-sm text-muted">to</span>
          <input type="date" className="border border-borderc rounded px-2 py-1" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      )}

      <button className="px-3 py-1 rounded bg-zuma-500 text-white" onClick={apply}>Apply</button>
    </div>
  )
}
