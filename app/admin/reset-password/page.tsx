"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import LanguageSwitcher from "@/components/shared/LanguageSwitcher"
import ThemeToggle from "@/components/shared/ThemeToggle"
import { useI18n } from "@/lib/i18n"
import { supabase } from "@/lib/supabase/browser"

const copy = {
  pt: {
    title: "Redefinir senha do admin",
    subtitle: "Defina uma nova senha para voltar a aceder ao portal administrativo da Zuma.",
    newPassword: "Nova senha",
    confirmPassword: "Confirmar nova senha",
    save: "Guardar nova senha",
    mismatch: "As senhas não coincidem.",
    minLength: "A nova senha deve ter pelo menos 6 caracteres.",
    back: "Voltar ao login admin",
  },
  en: {
    title: "Reset admin password",
    subtitle: "Set a new password to regain access to the Zuma admin portal.",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    save: "Save new password",
    mismatch: "Passwords do not match.",
    minLength: "Your new password must be at least 6 characters long.",
    back: "Back to admin login",
  },
} as const

export default function AdminResetPasswordPage() {
  const router = useRouter()
  const { locale, t } = useI18n()
  const pageCopy = copy[locale]

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setError(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password.length < 6) {
      setError(pageCopy.minLength)
      return
    }

    if (password !== confirmPassword) {
      setError(pageCopy.mismatch)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) throw updateError

      router.push("/admin/login?reset=success")
    } catch (resetError) {
      console.error("Error updating admin password:", resetError)
      setError(resetError instanceof Error ? resetError.message : t("errors.generic"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-end gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle compact />
        </div>

        <div className="rounded-3xl border border-borderc bg-card p-8 shadow-lg">
          <div className="text-center">
            <Link href="/admin/login" className="text-4xl font-bold text-primary">
              ZUMA
            </Link>
            <h1 className="mt-6 text-3xl font-bold text-foreground">
              {pageCopy.title}
            </h1>
            <p className="mt-3 text-muted">{pageCopy.subtitle}</p>
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                {pageCopy.newPassword}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-borderc bg-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                {pageCopy.confirmPassword}
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-borderc bg-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("common.processing") : pageCopy.save}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/admin/login" className="text-sm font-semibold text-primary hover:underline">
              {pageCopy.back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
