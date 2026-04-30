import 'server-only'
import { ValidationError } from '@/src/server/http/errors'
import { createSupabaseAdminClient } from '@/src/server/platform/db/supabase'
import { SiteSettingEntrySchema } from './site-settings.schema'
import {
  SITE_SETTING_KEYS,
  mapSiteSettingsRows,
  validateSiteSettingValue,
} from './site-settings.mapper'

export async function getSiteSettings() {
  const adminClient = createSupabaseAdminClient()
  const { data, error } = await adminClient
    .from('site_content')
    .select('key, value')
    .in('key', [...SITE_SETTING_KEYS])

  if (error) {
    throw new ValidationError(error.message)
  }

  return { data: mapSiteSettingsRows((data ?? []) as Array<{ key: string; value: unknown }>) }
}

export async function upsertSiteSetting(request: Request) {
  const payload = SiteSettingEntrySchema.parse(await request.json())
  const adminClient = createSupabaseAdminClient()
  const normalizedValue = validateSiteSettingValue(payload.key, payload.value)

  const { data, error } = await adminClient
    .from('site_content')
    .upsert({ key: payload.key, value: normalizedValue, updated_at: new Date().toISOString() })
    .select('key, value')
    .maybeSingle()

  if (error) {
    throw new ValidationError(error.message)
  }

  return data ? { data } : { success: true }
}
