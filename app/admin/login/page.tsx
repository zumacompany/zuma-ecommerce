"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabase/browser"
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react"

export default function AdminLoginPage() {
    const router = useRouter()
    const [checkingBootstrap, setCheckingBootstrap] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function checkBootstrap() {
            try {
                const res = await fetch("/api/admin/bootstrap-status", { cache: "no-store" })
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load admin status")
                }

                if (active && !data.hasAdmins) {
                    router.replace("/admin/signup")
                    return
                }
            } catch (err: any) {
                if (active) {
                    setError(err.message || "Failed to load admin status")
                }
            } finally {
                if (active) {
                    setCheckingBootstrap(false)
                }
            }
        }

        checkBootstrap()

        return () => {
            active = false
        }
    }, [router])

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) throw authError

            // Clear login error first
            setError(null)

            // Check if user has admin role after successful login
            const user = data?.user
            const role = user?.app_metadata?.role ?? user?.user_metadata?.role
            const roles = user?.app_metadata?.roles ?? user?.user_metadata?.roles
            const isAdmin = role === 'admin' || (Array.isArray(roles) && roles.includes('admin'))

            if (!isAdmin) {
                // Sign out immediately if not admin
                await supabase.auth.signOut()
                throw new Error("Sua conta não possui permissões de administrador.")
            }

            router.push("/admin")
            router.refresh()
        } catch (err: any) {
            setError(err.message || "Falha ao entrar")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-borderc shadow-xl">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-zuma-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-zuma-500/20">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-foreground tracking-tight">Admin Portal</h2>
                    <p className="mt-2 text-sm text-muted">
                        Secure access to Zuma management
                    </p>
                </div>

                {checkingBootstrap ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-zuma-500" />
                    </div>
                ) : (
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-muted/50" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-background border border-borderc rounded-xl text-foreground placeholder-muted/50 focus:ring-2 focus:ring-zuma-500 focus:border-zuma-500 transition-all sm:text-sm"
                                    placeholder="admin@zuma.io"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-muted mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-muted/50" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-background border border-borderc rounded-xl text-foreground placeholder-muted/50 focus:ring-2 focus:ring-zuma-500 focus:border-zuma-500 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-zuma-500 hover:bg-zuma-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zuma-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zuma-500/20"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Sign in to Dashboard"
                            )}
                        </button>
                    </div>

                    <div className="text-center text-sm text-muted">
                        Need an admin account?{" "}
                        <Link href="/admin/signup" className="font-semibold text-zuma-500 hover:text-zuma-600">
                            Create one
                        </Link>
                    </div>
                </form>
                )}
            </div>
        </div>
    )
}
