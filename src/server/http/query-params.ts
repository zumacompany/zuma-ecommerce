import 'server-only'

export type SortDirection = 'asc' | 'desc'

export type ParsedListParams<F extends string = string> = {
  sort: F
  dir: SortDirection
  page: number
  q: string
}

const DEFAULT_PAGE_MAX = 1000

export function parseSort<F extends string>(
  raw: unknown,
  allowed: readonly F[],
  fallback: F,
): F {
  if (typeof raw !== 'string') return fallback
  return (allowed as readonly string[]).includes(raw) ? (raw as F) : fallback
}

export function parseDirection(raw: unknown, fallback: SortDirection = 'desc'): SortDirection {
  if (raw === 'asc' || raw === 'desc') return raw
  return fallback
}

export function parsePage(raw: unknown, fallback = 1, max = DEFAULT_PAGE_MAX): number {
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : NaN
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(n, max)
}

export function parseEnumParam<E extends string>(
  raw: unknown,
  allowed: readonly E[],
): E | null {
  if (typeof raw !== 'string') return null
  return (allowed as readonly string[]).includes(raw) ? (raw as E) : null
}

/**
 * Escapes user-supplied text for safe interpolation into Postgres ILIKE patterns
 * AND into Supabase `.or()` filter strings.
 *
 * `.or()` parses commas, parens, and dots as filter delimiters, so we must strip
 * them. ILIKE itself reads `%`, `_`, and `\` as wildcards/escape chars.
 */
export function escapeIlike(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/[(),]/g, ' ')
    .trim()
}

export function parseListParams<F extends string>(
  searchParams: { [key: string]: string | string[] | undefined } | undefined,
  options: {
    allowedSort: readonly F[]
    defaultSort: F
    defaultDir?: SortDirection
    maxPage?: number
  },
): ParsedListParams<F> {
  const sp = searchParams ?? {}
  const rawQ = typeof sp.q === 'string' ? sp.q : ''
  return {
    sort: parseSort(sp.sort, options.allowedSort, options.defaultSort),
    dir: parseDirection(sp.dir, options.defaultDir ?? 'desc'),
    page: parsePage(sp.page, 1, options.maxPage),
    q: escapeIlike(rawQ),
  }
}
