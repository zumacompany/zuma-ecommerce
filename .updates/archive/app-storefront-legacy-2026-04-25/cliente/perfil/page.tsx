"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/browser";

type CustomerProfile = {
  customer_id: string;
  name: string | null;
  email: string | null;
  whatsapp_display: string | null;
  whatsapp_e164: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
};

type NotificationPreferences = {
  email_notifications: boolean;
  whatsapp_notifications: boolean;
};

const copy = {
  pt: {
    subtitle: "Mantenha os seus dados principais actualizados para acelerar o suporte e futuras compras.",
    profileTitle: "Dados da conta",
    preferencesTitle: "Preferências de contacto",
    empty: "Ainda não encontramos um perfil associado a esta conta.",
    name: "Nome",
    email: "Email",
    whatsapp: "WhatsApp",
    country: "País",
    province: "Província",
    city: "Cidade",
    emailNotifications: "Receber notificações por email",
    whatsappNotifications: "Receber notificações por WhatsApp",
    saveSuccess: "Perfil actualizado com sucesso.",
  },
  en: {
    subtitle: "Keep your main account details up to date to speed up support and future purchases.",
    profileTitle: "Account details",
    preferencesTitle: "Contact preferences",
    empty: "We could not find a customer profile linked to this account yet.",
    name: "Name",
    email: "Email",
    whatsapp: "WhatsApp",
    country: "Country",
    province: "Province",
    city: "City",
    emailNotifications: "Receive email notifications",
    whatsappNotifications: "Receive WhatsApp notifications",
    saveSuccess: "Profile updated successfully.",
  },
} as const;

export default function CustomerProfilePage() {
  const { locale, t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    whatsapp_notifications: true,
  });

  const pageCopy = copy[locale];

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: customerError } = await supabase.rpc("get_customer_by_auth_user", {
          p_auth_user_id: user.id,
        });

        if (customerError) throw customerError;

        const customer = Array.isArray(data) ? data[0] : null;

        if (!customer) {
          setProfile(null);
          return;
        }

        setCustomerId(customer.customer_id);
        setProfile({
          customer_id: customer.customer_id,
          name: customer.name ?? "",
          email: customer.email ?? user.email ?? "",
          whatsapp_display: customer.whatsapp_display ?? "",
          whatsapp_e164: customer.whatsapp_e164 ?? "",
          country: customer.country ?? "",
          province: customer.province ?? "",
          city: customer.city ?? "",
        });

        const { data: prefs, error: prefsError } = await supabase
          .from("customer_preferences")
          .select("email_notifications, whatsapp_notifications")
          .eq("customer_id", customer.customer_id)
          .maybeSingle();

        if (prefsError) throw prefsError;

        if (prefs) {
          setHasPreferences(true);
          setPreferences({
            email_notifications: prefs.email_notifications ?? true,
            whatsapp_notifications: prefs.whatsapp_notifications ?? true,
          });
        } else {
          setHasPreferences(false);
          setPreferences({
            email_notifications: true,
            whatsapp_notifications: true,
          });
        }
      } catch (fetchError) {
        console.error("Error fetching customer profile:", fetchError);
        setError(fetchError instanceof Error ? fetchError.message : t("errors.generic"));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, user]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerId || !profile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const normalizedProfile = {
        name: profile.name?.trim() || null,
        country: profile.country?.trim() || null,
        province: profile.province?.trim() || null,
        city: profile.city?.trim() || null,
      };

      const customerPromise = supabase
        .from("customers")
        .update(normalizedProfile)
        .eq("id", customerId);

      const preferencesPromise = hasPreferences
        ? supabase
            .from("customer_preferences")
            .update({
              email_notifications: preferences.email_notifications,
              whatsapp_notifications: preferences.whatsapp_notifications,
            })
            .eq("customer_id", customerId)
        : supabase.from("customer_preferences").insert({
            customer_id: customerId,
            email_notifications: preferences.email_notifications,
            whatsapp_notifications: preferences.whatsapp_notifications,
          });

      const [{ error: customerError }, { error: preferencesError }] = await Promise.all([
        customerPromise,
        preferencesPromise,
      ]);

      if (customerError) throw customerError;
      if (preferencesError) throw preferencesError;

      setHasPreferences(true);
      setSuccess(pageCopy.saveSuccess);
    } catch (saveError) {
      console.error("Error saving customer profile:", saveError);
      setError(saveError instanceof Error ? saveError.message : t("errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.loading")}>
        <div className="h-28 rounded-2xl bg-muted/10 animate-pulse" />
        <div className="h-[420px] rounded-3xl border border-borderc bg-muted/10 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-3xl border border-borderc bg-card p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-foreground">{t("customer.profile")}</h1>
        <p className="mt-3 text-muted">{error ?? pageCopy.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-borderc bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground">{t("customer.profile")}</h1>
        <p className="mt-2 max-w-2xl text-muted">{pageCopy.subtitle}</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSave} className="rounded-3xl border border-borderc bg-card p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{pageCopy.profileTitle}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{pageCopy.name}</span>
                <input
                  type="text"
                  value={profile.name ?? ""}
                  onChange={(event) =>
                    setProfile((current) =>
                      current ? { ...current, name: event.target.value } : current
                    )
                  }
                  className="w-full rounded-xl border border-borderc bg-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{pageCopy.email}</span>
                <input
                  type="email"
                  value={profile.email ?? ""}
                  disabled
                  className="w-full rounded-xl border border-borderc bg-muted/10 px-4 py-3 text-sm text-muted outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{pageCopy.whatsapp}</span>
                <input
                  type="text"
                  value={profile.whatsapp_e164 || profile.whatsapp_display || ""}
                  disabled
                  className="w-full rounded-xl border border-borderc bg-muted/10 px-4 py-3 text-sm text-muted outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{pageCopy.country}</span>
                <input
                  type="text"
                  value={profile.country ?? ""}
                  onChange={(event) =>
                    setProfile((current) =>
                      current ? { ...current, country: event.target.value } : current
                    )
                  }
                  className="w-full rounded-xl border border-borderc bg-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{pageCopy.province}</span>
                <input
                  type="text"
                  value={profile.province ?? ""}
                  onChange={(event) =>
                    setProfile((current) =>
                      current ? { ...current, province: event.target.value } : current
                    )
                  }
                  className="w-full rounded-xl border border-borderc bg-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">{pageCopy.city}</span>
                <input
                  type="text"
                  value={profile.city ?? ""}
                  onChange={(event) =>
                    setProfile((current) =>
                      current ? { ...current, city: event.target.value } : current
                    )
                  }
                  className="w-full rounded-xl border border-borderc bg-bg px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-borderc bg-bg p-5">
            <h2 className="text-xl font-semibold text-foreground">{pageCopy.preferencesTitle}</h2>
            <div className="mt-5 space-y-4">
              <label className="flex items-start gap-3 rounded-xl border border-borderc bg-card p-4">
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      email_notifications: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-borderc text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{pageCopy.emailNotifications}</span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-borderc bg-card p-4">
                <input
                  type="checkbox"
                  checked={preferences.whatsapp_notifications}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      whatsapp_notifications: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-borderc text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">
                  {pageCopy.whatsappNotifications}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t("common.processing") : t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
