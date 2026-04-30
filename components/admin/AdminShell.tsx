"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import AdminSidebar from "./AdminSidebar"
import AdminTopBar from "./AdminTopBar"

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const pathname = usePathname()
  const isAuthPage =
    pathname === "/admin/login"
    || pathname === "/admin/signup"
    || pathname === "/admin/reset-password"

  if (isAuthPage) {
    return <div className="min-h-screen bg-bg text-text">{children}</div>
  }

  return (
    <div
      className="h-screen overflow-hidden bg-bg text-text"
      style={{
        backgroundImage:
          "radial-gradient(1200px 600px at 10% -10%, rgba(58,122,254,0.12), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(58,122,254,0.08), transparent 55%)",
      }}
    >
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64">
        <AdminSidebar />
      </div>

      <div className="flex h-full min-h-0 flex-col lg:pl-64">
        <div className="flex min-h-0 flex-1 flex-col">
          <AdminTopBar onOpenNav={() => setNavOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          />
          <div className="relative h-[100dvh] w-[min(16.5rem,85vw)] max-w-[85vw] shadow-pop">
            <AdminSidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
