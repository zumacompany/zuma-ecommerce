"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const presets = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "custom", label: "Custom" },
]

export default function AnalyticsRangePicker() {
  const router = useRouter()
  const params = useSearchParams()
  const preset = params?.get("preset") ?? "30d"
  const startParam = params?.get("start") ?? ""
  const endParam = params?.get("end") ?? ""

  const [localPreset, setLocalPreset] = useState(preset)
  const [start, setStart] = useState(startParam)
  const [end, setEnd] = useState(endParam)

  function apply() {
    const sp = new URLSearchParams(Array.from(params ?? []) as any)
    if (localPreset === "custom") {
      if (start) sp.set("start", start)
      if (end) sp.set("end", end)
      sp.set("preset", "custom")
    } else {
      sp.set("preset", localPreset)
      sp.delete("start")
      sp.delete("end")
    }
    const q = sp.toString()
    router.push(`/admin/analytics${q ? "?" + q : ""}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-borderc bg-card px-2 py-1">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => setLocalPreset(p.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              localPreset === p.key
                ? "bg-zuma-500 text-white"
                : "text-muted hover:bg-muted/20"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {localPreset === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            className="rounded-lg border border-borderc bg-card px-2 py-1 text-xs"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <span className="text-xs text-muted">to</span>
          <input
            type="date"
            className="rounded-lg border border-borderc bg-card px-2 py-1 text-xs"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      )}

      <button
        onClick={apply}
        className="rounded-full bg-zuma-500 px-4 py-1.5 text-xs font-semibold text-white"
      >
        Apply
      </button>
    </div>
  )
}
