"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { AlertCircle, Loader2, Lock, Mail, ShieldPlus } from "lucide-react"
import { supabase } from "@/lib/supabase/browser"

export default function AdminSignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      const response = await fetch("/api/admin/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin account.")
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setSuccess("Admin account created. You can now sign in.")
        router.push("/admin/login")
        router.refresh()
        return
      }

      router.push("/admin")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to create admin account.")
      setLoading(false)
      return
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-borderc bg-card p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zuma-500 shadow-lg shadow-zuma-500/20">
            <ShieldPlus className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Create Admin Account</h1>
          <p className="mt-2 text-sm text-muted">
            Create a new admin account.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {(error || success) && (
            <div
              className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${
                error
                  ? "border-red-100 bg-red-50 text-red-600"
                  : "border-emerald-100 bg-emerald-50 text-emerald-700"
              }`}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error || success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-muted">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted/50" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="block w-full rounded-xl border border-borderc bg-background py-2.5 pl-10 pr-3 text-foreground placeholder-muted/50 transition-all focus:border-zuma-500 focus:ring-2 focus:ring-zuma-500 sm:text-sm"
                  placeholder="admin@zuma.io"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-muted">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted/50" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="block w-full rounded-xl border border-borderc bg-background py-2.5 pl-10 pr-3 text-foreground placeholder-muted/50 transition-all focus:border-zuma-500 focus:ring-2 focus:ring-zuma-500 sm:text-sm"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-muted">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted/50" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="block w-full rounded-xl border border-borderc bg-background py-2.5 pl-10 pr-3 text-foreground placeholder-muted/50 transition-all focus:border-zuma-500 focus:ring-2 focus:ring-zuma-500 sm:text-sm"
                  placeholder="Repeat your password"
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl border border-transparent bg-zuma-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-zuma-500/20 transition-all hover:bg-zuma-600 focus:outline-none focus:ring-2 focus:ring-zuma-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Admin"}
          </button>
        </form>

        <div className="text-center text-sm text-muted">
          Already have access?{" "}
          <Link href="/admin/login" className="font-semibold text-zuma-500 hover:text-zuma-600">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
