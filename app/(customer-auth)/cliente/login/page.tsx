"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { APP_CONFIG } from "@/lib/config";
import { supabase } from "@/lib/supabase/browser";
import Link from "next/link";
import CustomerAuthShell from "@/components/customer/CustomerAuthShell";

type PrefillPayload = {
  email?: string;
  whatsapp?: string;
  name?: string;
};

function decodePrefill(raw: string | null): PrefillPayload | null {
  if (!raw) return null;
  if (typeof window === "undefined") return null;
  try {
    const decoded = window.atob(raw);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as PrefillPayload;
    }
  } catch {
    /* malformed prefill — ignore */
  }
  return null;
}

function stripPhonePrefix(raw: string | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (trimmed.startsWith(APP_CONFIG.DEFAULT_PHONE_PREFIX)) {
    return trimmed
      .slice(APP_CONFIG.DEFAULT_PHONE_PREFIX.length)
      .replace(/[^0-9]/g, "");
  }
  return trimmed.replace(/[^0-9]/g, "");
}

export default function CustomerLoginPage() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const resetSuccessMessage =
    locale === "en"
      ? "Your password has been reset. Sign in with your new password."
      : "A sua senha foi redefinida. Faça login com a nova senha.";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setResetSuccess(params.get("reset") === "success");

    if (params.get("mode") === "register") {
      setMode("register");
    }

    const prefill = decodePrefill(params.get("prefill"));
    if (prefill) {
      if (prefill.email) setEmail((prev) => (prev === "" ? prefill.email! : prev));
      if (prefill.name) setName((prev) => (prev === "" ? prefill.name! : prev));
      if (prefill.whatsapp) {
        const stripped = stripPhonePrefix(prefill.whatsapp);
        setWhatsapp((prev) => (prev === "" ? stripped : prev));
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push("/cliente/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const whatsappE164 = whatsapp.startsWith("+258")
      ? whatsapp
      : `+258${whatsapp}`;

    const { error: signUpError } = await signUp(email, password, {
      name,
      whatsapp: whatsappE164,
      province,
      city,
      role: "customer",
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      // Link guest orders if any
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.rpc("link_guest_orders_to_account", {
          p_auth_user_id: user.id,
          p_whatsapp_e164: whatsappE164,
        });
      }

      router.push("/cliente/dashboard");
    }
  };

  return (
    <CustomerAuthShell
      header={
        <div className="text-center">
          <Link href="/" className="text-4xl font-bold text-primary">
            ZUMA
          </Link>
          <p className="mt-2 text-muted">
            {mode === "login" ? t("customer.login") : t("customer.register")}
          </p>
        </div>
      }
    >
      {resetSuccess && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {resetSuccessMessage}
        </div>
      )}

      <div className="mb-6 mt-8 flex gap-2">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg px-4 py-2 font-semibold transition-all ${
            mode === "login"
              ? "bg-primary text-white"
              : "bg-muted/20 text-muted hover:bg-muted/30"
          }`}
        >
          {t("customer.login")}
        </button>
        <button
          onClick={() => setMode("register")}
          className={`flex-1 rounded-lg px-4 py-2 font-semibold transition-all ${
            mode === "register"
              ? "bg-primary text-white"
              : "bg-muted/20 text-muted hover:bg-muted/30"
          }`}
        >
          {t("customer.register")}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-danger-100 bg-danger-50 p-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* Login Form */}
      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("common.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("customer.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <Link
            href="/cliente/recuperar-senha"
            className="text-sm text-primary hover:underline block"
          >
            {t("customer.forgotPassword")}
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("common.processing") : t("customer.login")}
          </button>
        </form>
      )}

      {/* Register Form */}
      {mode === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("checkout.fullName")} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder={t("checkout.namePlaceholder")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("common.email")} *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("common.whatsapp")} *
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="841234567"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("customer.password")} *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-borderc bg-bg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("common.processing") : t("customer.createAccount")}
          </button>

          <p className="text-xs text-center text-muted">
            {t("customer.agreeToTerms")}
          </p>
        </form>
      )}

      {mode === "register" && (
        <div className="mt-6 border-t border-borderc pt-6">
          <p className="mb-3 text-sm font-semibold">
            {t("customer.benefits.title")}
          </p>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              <span>{t("customer.benefits.orderHistory")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              <span>{t("customer.benefits.fastCheckout")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              <span>{t("customer.benefits.loyaltyPoints")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">✓</span>
              <span>{t("customer.benefits.exclusiveOffers")}</span>
            </li>
          </ul>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← {t("common.back")} {t("customer.toHomepage")}
        </Link>
      </div>
    </CustomerAuthShell>
  );
}
