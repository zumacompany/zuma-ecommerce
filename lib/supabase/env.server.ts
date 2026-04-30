import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

const ENV_PATHS = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
]
let loaded = false

function parseEnvLine(line: string) {
  let trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  if (trimmed.startsWith('export ')) trimmed = trimmed.slice(7).trim()
  const eqIndex = trimmed.indexOf('=')
  if (eqIndex <= 0) return null
  const key = trimmed.slice(0, eqIndex).trim()
  let value = trimmed.slice(eqIndex + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  return { key, value }
}

export function ensureSupabaseEnv() {
  if (loaded) return
  loaded = true

  const needsEnv = !process.env.SUPABASE_URL
    || !process.env.SUPABASE_SERVICE_ROLE_KEY
    || !process.env.NEXT_PUBLIC_SUPABASE_URL
    || (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

  if (!needsEnv) return
  for (const envPath of ENV_PATHS) {
    if (!fs.existsSync(envPath)) continue

    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line)
      if (!parsed) continue
      if (!parsed.key.startsWith('SUPABASE_') && !parsed.key.startsWith('NEXT_PUBLIC_SUPABASE_')) {
        continue
      }
      if (!process.env[parsed.key]) process.env[parsed.key] = parsed.value
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  }
}
