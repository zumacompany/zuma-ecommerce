const DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export function formatRelativeTime(
  value: string | number | Date,
  locale?: Intl.LocalesArgument
) {
  const date = value instanceof Date ? value : new Date(value);
  const diffSeconds = (date.getTime() - Date.now()) / 1000;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  let duration = diffSeconds;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return formatter.format(0, 'second');
}

export function resolveRelativeTimeLocale(locale?: string): Intl.LocalesArgument | undefined {
  if (!locale) return undefined
  if (locale === 'pt') return 'pt-MZ'
  if (locale === 'en') return 'en-US'
  return locale
}
