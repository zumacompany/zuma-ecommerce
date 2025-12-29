"use client"

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

export default function AdminSearch({ placeholder }: { placeholder: string }) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", "1") // reset to first page on search
        if (term) {
            params.set("q", term)
        } else {
            params.delete("q")
        }
        replace(`${pathname}?${params.toString()}`)
    }, 400) // 400ms debounce

    return (
        <div className="relative flex flex-1 flex-shrink-0">
            <label htmlFor="search" className="sr-only">Search</label>
            <input
                className="peer block w-full rounded-lg border border-borderc bg-card py-[9px] pl-10 text-sm outline-2 placeholder:text-muted focus:border-zuma-500 focus:ring-1 focus:ring-zuma-500"
                placeholder={placeholder}
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get("q")?.toString()}
            />
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted peer-focus:text-zuma-500"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
            </svg>
        </div>
    )
}
