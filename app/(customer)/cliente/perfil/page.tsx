"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/browser";

type CustomerProfile = {
  customer_id: string;
  name: string | null;
  email: string | null;
  whatsapp_e164: string | null;
  whatsapp_display: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  birthdate: string | null;
  loyalty_points: number;
};

type FormState = {
  name: string;
  whatsapp: string;
  country: string;
  province: string;
  city: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  whatsapp: "",
  country: "",
  province: "",
  city: "",
};

function profileToForm(profile: CustomerProfile): FormState {
  return {
    name: profile.name ?? "",
    whatsapp: profile.whatsapp_e164 ?? "",
    country: profile.country ?? "",
    province: profile.province ?? "",
    city: profile.city ?? "",
  };
}

export default function CustomerProfilePage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error: rpcError } = await supabase.rpc(
        "get_customer_by_auth_user",
        { p_auth_user_id: user.id }
      );

      if (cancelled) return;

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      const row = Array.isArray(data) && data.length > 0 ? (data[0] as CustomerProfile) : null;
      if (row) {
        setProfile(row);
        setForm(profileToForm(row));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setError(null);
    setSavedAt(null);

    const payload = {
      name: form.name.trim() || null,
      whatsapp_e164: form.whatsapp.trim() || null,
      country: form.country.trim() || null,
      province: form.province.trim() || null,
      city: form.city.trim() || null,
    };

    const { error: updateError } = await supabase
      .from("customers")
      .update(payload)
      .eq("auth_user_id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfile({ ...profile, ...payload });
      setSavedAt(Date.now());
    }
    setSaving(false);
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("common.loading")}>
        <div className="h-24 rounded-xl bg-muted/10 animate-pulse" />
        <div className="h-72 rounded-xl bg-muted/10 animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl bg-card p-8 border border-borderc text-center">
        <div className="text-5xl mb-4">👤</div>
        <h1 className="text-2xl font-bold mb-2">{t("customer.profile")}</h1>
        <p className="text-muted">{t("customer.profileNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card p-6 border border-borderc">
        <h1 className="text-2xl font-bold mb-1">{t("customer.profile")}</h1>
        <p className="text-muted text-sm">{t("customer.profileSubtitle")}</p>
        {user?.email && (
          <p className="mt-3 text-xs text-muted">{user.email}</p>
        )}
      </div>

      <form onSubmit={onSave} className="rounded-xl bg-card p-6 border border-borderc space-y-4">
        <h2 className="text-lg font-semibold mb-2">{t("customer.profilePersonalInfo")}</h2>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="profile-name">
            {t("checkout.fullName")}
          </label>
          <input
            id="profile-name"
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg border border-borderc bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder={t("checkout.namePlaceholder")}
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="profile-whatsapp">
            WhatsApp
          </label>
          <input
            id="profile-whatsapp"
            type="tel"
            value={form.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            className="w-full rounded-lg border border-borderc bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="+258..."
            autoComplete="tel"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="profile-country">
              {t("checkout.country")}
            </label>
            <input
              id="profile-country"
              type="text"
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className="w-full rounded-lg border border-borderc bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoComplete="country-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="profile-province">
              {t("checkout.province")}
            </label>
            <input
              id="profile-province"
              type="text"
              value={form.province}
              onChange={(e) => update("province", e.target.value)}
              className="w-full rounded-lg border border-borderc bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoComplete="address-level1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="profile-city">
              {t("checkout.city")}
            </label>
            <input
              id="profile-city"
              type="text"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full rounded-lg border border-borderc bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={t("checkout.cityPlaceholder")}
              autoComplete="address-level2"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? t("common.loading") : t("customer.profileSaveButton")}
          </button>
          {savedAt && !error && (
            <span className="text-sm text-green-600">{t("customer.profileSaved")}</span>
          )}
          {error && <span className="text-sm text-danger-500">{error}</span>}
        </div>
      </form>
    </div>
  );
}
