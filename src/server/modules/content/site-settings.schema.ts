import { z } from 'zod'

export const SITE_CURRENCIES = ['MZN'] as const
export const SITE_LANGUAGES = ['pt', 'en'] as const

export const SITE_SETTING_KEYS = [
  'currency',
  'language',
  'contact_email',
  'contact_whatsapp',
  'whatsapp_number',
  'admin_name',
  'admin_title',
] as const

export const SiteCurrencySchema = z.enum(SITE_CURRENCIES)
export const SiteLanguageSchema = z.enum(SITE_LANGUAGES)
export const SiteSettingKeySchema = z.enum(SITE_SETTING_KEYS)

export const SiteSettingsSchema = z.object({
  currency: SiteCurrencySchema,
  language: SiteLanguageSchema,
  contact_email: z.string().trim().max(160),
  contact_whatsapp: z.string().trim().max(32),
  whatsapp_number: z.string().trim().max(32),
  admin_name: z.string().trim().max(120),
  admin_title: z.string().trim().max(120),
})

export const SiteSettingEntrySchema = z.object({
  key: SiteSettingKeySchema,
  value: z.unknown(),
})

export type SiteCurrency = z.infer<typeof SiteCurrencySchema>
export type SiteLanguage = z.infer<typeof SiteLanguageSchema>
export type SiteSettingKey = z.infer<typeof SiteSettingKeySchema>
export type SiteSettings = z.infer<typeof SiteSettingsSchema>
