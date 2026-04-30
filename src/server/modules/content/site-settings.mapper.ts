import {
  SITE_CURRENCIES,
  SITE_LANGUAGES,
  SITE_SETTING_KEYS,
  SiteCurrencySchema,
  SiteLanguageSchema,
  type SiteSettingKey,
  type SiteSettings,
} from './site-settings.schema'

export { SITE_CURRENCIES, SITE_LANGUAGES, SITE_SETTING_KEYS }

export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  currency: 'MZN',
  language: 'pt',
  contact_email: '',
  contact_whatsapp: '',
  whatsapp_number: '',
  admin_name: '',
  admin_title: '',
}

type SiteSettingRow = {
  key: string
  value: unknown
}

function unwrapSiteSettingValue(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value) {
    return (value as { value?: unknown }).value
  }

  return value
}

export function isSiteSettingKey(value: string): value is SiteSettingKey {
  return SITE_SETTING_KEYS.includes(value as SiteSettingKey)
}

export function extractSiteSettingString(value: unknown, fallback = '') {
  const unwrapped = unwrapSiteSettingValue(value)
  return typeof unwrapped === 'string' && unwrapped.trim() ? unwrapped.trim() : fallback
}

function normalizeSiteSettingValue<K extends SiteSettingKey>(
  key: K,
  value: unknown
): SiteSettings[K] {
  const unwrapped = unwrapSiteSettingValue(value)

  if (key === 'currency') {
    return (
      (SiteCurrencySchema.safeParse(unwrapped).success
        ? unwrapped
        : SITE_SETTINGS_DEFAULTS.currency) as SiteSettings[K]
    )
  }

  if (key === 'language') {
    return (
      (SiteLanguageSchema.safeParse(unwrapped).success
        ? unwrapped
        : SITE_SETTINGS_DEFAULTS.language) as SiteSettings[K]
    )
  }

  return extractSiteSettingString(unwrapped, SITE_SETTINGS_DEFAULTS[key]) as SiteSettings[K]
}

export function validateSiteSettingValue<K extends SiteSettingKey>(
  key: K,
  value: unknown
): SiteSettings[K] {
  const unwrapped = unwrapSiteSettingValue(value)

  if (key === 'currency') {
    return SiteCurrencySchema.parse(unwrapped) as SiteSettings[K]
  }

  if (key === 'language') {
    return SiteLanguageSchema.parse(unwrapped) as SiteSettings[K]
  }

  return extractSiteSettingString(unwrapped, SITE_SETTINGS_DEFAULTS[key]) as SiteSettings[K]
}

export function mapSiteSettingsRows(rows: SiteSettingRow[]): SiteSettings {
  const settings = { ...SITE_SETTINGS_DEFAULTS }

  for (const row of rows) {
    if (!isSiteSettingKey(row.key)) continue

    const key = row.key
    ;(settings as Record<SiteSettingKey, unknown>)[key] = normalizeSiteSettingValue(key, row.value)
  }

  return settings
}

export const SITE_CURRENCY_OPTIONS = SITE_CURRENCIES.map((value) => ({
  value,
  label: 'Mozambican Metical (MZN)',
}))

export const SITE_LANGUAGE_OPTIONS = SITE_LANGUAGES.map((value) => ({
  value,
  label: value === 'pt' ? 'Portuguese' : 'English',
}))
