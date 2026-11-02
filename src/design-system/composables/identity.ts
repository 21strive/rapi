/** There are eight identity colours: --r-identity-1 … --r-identity-8 (plus a -text pair each). */
export const IDENTITY_COUNT = 8

/** Same name, same colour, on every screen. Returns 1–8. */
export function identityIndex(name: string): number {
  let hash = 7
  for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return (hash % IDENTITY_COUNT) + 1
}

/** CSS variables for an identity colour, ready for a `style` binding. */
export function identityColors(indexOrName: number | string): { background: string; color: string } {
  const index = typeof indexOrName === 'number' ? indexOrName : identityIndex(indexOrName)
  return { background: `var(--r-identity-${index})`, color: `var(--r-identity-${index}-text)` }
}

/** "Kim Ji-soo" → "KJ", "Nurul" → "N". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  const first = words[0][0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}
