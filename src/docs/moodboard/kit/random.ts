/**
 * Seeded randomness, so a tile shows the same data on every load and in every screenshot.
 * Use a string seed per variant: `const rnd = seeded('tune-fader-mix')`.
 */

function hash(seed: string | number): number {
  if (typeof seed === 'number') return seed >>> 0
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32: a small, fast, good-enough generator. Returns numbers in [0, 1). */
export function seeded(seed: string | number): () => number {
  let a = hash(seed)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A random walk: `n` values starting near `start`, each step up to ±`vol` × start. */
export function walk(
  seed: string | number,
  n: number,
  start: number,
  vol = 0.06,
  { min = -Infinity, max = Infinity, drift = 0, decimals = 2 }: { min?: number; max?: number; drift?: number; decimals?: number } = {},
): number[] {
  const rnd = seeded(seed)
  const out: number[] = []
  let v = start
  const f = 10 ** decimals
  for (let i = 0; i < n; i++) {
    out.push(Math.round(v * f) / f)
    v = Math.min(max, Math.max(min, v + (rnd() - 0.5 + drift) * 2 * vol * Math.abs(start || 1)))
  }
  return out
}

/** A daily or weekly shape: a wave with noise, good for traffic, load and footfall. */
export function wave(
  seed: string | number,
  n: number,
  { base = 50, amp = 20, period = 24, phase = 0, noise = 0.1, decimals = 0 } = {},
): number[] {
  const rnd = seeded(seed)
  const f = 10 ** decimals
  return Array.from({ length: n }, (_, i) => {
    const v = base + amp * Math.sin(((i + phase) / period) * Math.PI * 2) + (rnd() - 0.5) * 2 * noise * base
    return Math.round(Math.max(0, v) * f) / f
  })
}

export function pick<T>(rnd: () => number, list: readonly T[]): T {
  return list[Math.floor(rnd() * list.length)]
}

export function between(rnd: () => number, min: number, max: number, decimals = 0): number {
  const f = 10 ** decimals
  return Math.round((min + rnd() * (max - min)) * f) / f
}

export function shuffle<T>(rnd: () => number, list: readonly T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
