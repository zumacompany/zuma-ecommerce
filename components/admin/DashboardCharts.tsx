"use client"
import React from 'react'

export function BarChart({ data, height = 200 }: { data: number[], height?: number }) {
    const max = Math.max(...data, 1)

    return (
        <div className="flex items-end justify-between gap-2 w-full" style={{ height }}>
            {data.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                        className="w-full bg-zuma-500/80 rounded-t-sm transition-all duration-500 hover:bg-zuma-400 group-hover:scale-y-105 origin-bottom"
                        style={{ height: `${(val / max) * 100}%` }}
                    />
                </div>
            ))}
        </div>
    )
}

export function DonutChart({ data }: { data: { label: string, value: number, color: string }[] }) {
    const total = data.reduce((s, d) => s + d.value, 0)
    let cumulative = 0

    // Calculate svg paths
    const paths = data.map((d) => {
        const startAngle = (cumulative / total) * 360
        cumulative += d.value
        const endAngle = (cumulative / total) * 360

        // math for svg arc
        const startRad = (startAngle - 90) * Math.PI / 180
        const endRad = (endAngle - 90) * Math.PI / 180
        const x1 = 50 + 40 * Math.cos(startRad)
        const y1 = 50 + 40 * Math.sin(startRad)
        const x2 = 50 + 40 * Math.cos(endRad)
        const y2 = 50 + 40 * Math.sin(endRad)
        const largeArc = endAngle - startAngle > 180 ? 1 : 0

        return {
            d: `M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`,
            color: d.color
        }
    })

    return (
        <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                {data.length === 0 && <circle cx="50" cy="50" r="40" fill="#333" />}
                {data.length > 0 && paths.map((p, i) => (
                    <path key={i} d={p.d} fill={p.color} className="transition-all hover:opacity-80" />
                ))}
                <circle cx="50" cy="50" r="25" fill="var(--bg-card)" />
            </svg>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-xs font-bold">{total}</div>
            </div>
        </div>
    )
}
