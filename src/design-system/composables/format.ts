/** Number formatting through Intl.NumberFormat, with formatters cached per locale + options. */

export const DEFAULT_LOCALE = 'en-US'

export interface FormatOptions extends Intl.NumberFormatOptions {
  locale?: string
}

const cache = new Map<string, Intl.NumberFormat>()

function formatter(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let nf = cache.get(key)
  if (!nf) {
    nf = new Intl.NumberFormat(locale, options)
    cache.set(key, nf)
  }
  return nf
}

/** 25912.43 → "25,912.43" */
export function formatNumber(value: number, { locale = DEFAULT_LOCALE, ...options }: FormatOptions = {}): string {
  return formatter(locale, options).format(value)
}

/** 25912 → "25.9K", 1200000 → "1.2M" */
export function formatCompact(
  value: number,
  { locale = DEFAULT_LOCALE, maximumFractionDigits = 1, ...options }: FormatOptions = {},
): string {
  return formatter(locale, { notation: 'compact', maximumFractionDigits, ...options }).format(value)
}

export interface PercentOptions {
  locale?: string
  /** Fraction digits. Default 1. */
  decimals?: number
  /** Show "+" for positive values. */
  signed?: boolean
}

/** Takes percentage points: 12.5 → "12.5%". */
export function formatPercent(value: number, { locale = DEFAULT_LOCALE, decimals = 1, signed = false }: PercentOptions = {}): string {
  return formatter(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(value / 100)
}

/** 25912 → "$25,912" (no cents unless you ask for them). */
export function formatCurrency(value: number, currency = 'USD', { locale = DEFAULT_LOCALE, ...options }: FormatOptions = {}): string {
  const max = options.maximumFractionDigits ?? Math.max(0, options.minimumFractionDigits ?? 0)
  const min = Math.min(options.minimumFractionDigits ?? 0, max)
  return formatter(locale, {
    style: 'currency',
    currency,
    ...options,
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(value)
}

/** Splits a formatted number at the decimal separator so the fraction can be styled on its own. */
export function formatNumberParts(value: number, options: FormatOptions = {}): { integer: string; fraction: string } {
  const { locale = DEFAULT_LOCALE, ...rest } = options
  const parts = formatter(locale, rest).formatToParts(value)
  const at = parts.findIndex((part) => part.type === 'decimal')
  if (at < 0) return { integer: parts.map((p) => p.value).join(''), fraction: '' }
  return {
    integer: parts
      .slice(0, at)
      .map((p) => p.value)
      .join(''),
    fraction: parts
      .slice(at)
      .map((p) => p.value)
      .join(''),
  }
}

/** Typographic minus for negative numbers in UI copy ("−1.2%" rather than "-1.2%"). */
export function withMinus(text: string): string {
  return text.replace(/^-/, '−')
}
