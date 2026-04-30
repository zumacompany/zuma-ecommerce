"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/browser";

const copy = {
  pt: {
    title: "Recuperar acesso",
    subtitle: "Peça um link seguro para redefinir a senha da sua conta Zuma.",
    emailSent: "Enviámos um link de recuperação para o seu email. Verifique a caixa de entrada.",
    requestLabel: "Email da conta",
    requestButton: "Enviar link de recuperação",
    resetTitle: "Definir nova senha",
    resetSubtitle: "Escolha uma senha nova para voltar a entrar na sua conta.",
    newPassword: "Nova senha",
    confirmPassword: "Confirmar nova senha",
    resetButton: "Guardar nova senha",
    mismatch: "As senhas não coincidem.",
    minLength: "A nova senha deve ter pelo menos 6 caracteres.",
    backToLogin: "Voltar ao login",
  },
  en: {
    title: "Recover access",
    subtitle: "Request a secure link to reset the password for your Zuma account.",
    emailSent: "We sent a recovery link to your email. Check your inbox.",
    requestLabel: "Account email",
    requestButton: "Send recovery link",
    resetTitle: "Set a new password",
    resetSubtitle: "Choose a new password to sign back into your account.",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    resetButton: "Save new password",
    mismatch: "Passwords do not match.",
    minLength: "Your new password must be at least 6 characters long.",
    backToLogin: "Back to login",
  },
} as const;

export default function CustomerPasswordRecoveryPage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageCopy = copy[locale];

  useEffect(() => {
    const syncRecoveryState = () => {
      if (typeof window === "undefined") return;

      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const isRecovery =
        hashParams.get("type") === "recovery" || hashParams.has("access_token");

      if (isRecovery) {
        setMode("reset");
        setSent(false);
        setError(null);
      }
    };

    syncRecoveryState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setSent(false);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const redirectTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}/cliente/recuperar-senha`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) throw resetError;

      setSent(true);
    } catch (requestError) {
      console.error("Error requesting password reset:", requestError);
      setError(requestError instanceof Error ? requestError.message : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 6) {
      setError(pageCopy.minLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(pageCopy.mismatch);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      router.push("/cliente/login?reset=success");
    } catch (resetError) {
      console.error("Error updating password:", resetError);
      setError(resetError instanceof Error ? resetError.message : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-end gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle compact />
        </div>

        <div className="rounded-3xl border border-borderc bg-card p-8 shadow-lg">
          <div className="text-center">
            <Link href="/" className="text-4xl font-bold text-primary">
              ZUMA
            </Link>
            <h1 className="mt-6 text-3xl font-bold text-foreground">
              {mode === "reset" ? pageCopy.resetTitle : pageCopy.title}
            </h1>
            <p className="mt-3 text-muted">
              {mode === "reset" ? pageCopy.resetSubtitle : pageCopy.subtitle}
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {sent && mode === "request" ? (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {pageCopy.emailSent}
            </div>
          ) : null}

          {mode === "request" ? (
            <form onSubmit={handleRequest} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  {pageCopy.requestLabel}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-borderc bg-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="seu@email.com"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t("common.processing") : pageCopy.requestButton}
              </button>
            </form>
          ) : (
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
                {loading ? t("common.processing") : pageCopy.resetButton}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/cliente/login" className="text-sm font-semibold text-primary hover:underline">
              {pageCopy.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
