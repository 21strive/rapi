/**
 * The air picture as a small simulation, ticking once a second on the real clock. Tracks fly
 * from their seeds (orbits, straight legs, a hostile probing the CRC), ring crossings and the
 * fighter's legs write the engagement log, and `assign()` sends the nearest fighter on CAP.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  ALERT_RING_NM,
  WEAPONS_DIRECTOR,
  bearingText,
  clockText,
  logSeeds,
  trackSeeds,
  type LogEntry,
  type TrackKind,
  type TrackMode,
} from './data'

const RAD = Math.PI / 180
const norm = (deg: number) => ((deg % 360) + 360) % 360
/** Smallest signed turn from a to b, in degrees (−180…180). */
const delta = (a: number, b: number) => ((b - a + 540) % 360) - 180
const bearingOf = (dx: number, dy: number) => norm(Math.atan2(dx, dy) / RAD)
const toXY = (bearing: number, range: number) => ({ x: range * Math.sin(bearing * RAD), y: range * Math.cos(bearing * RAD) })
const approach = (value: number, target: number, step: number) =>
  value < target ? Math.min(target, value + step) : Math.max(target, value - step)
const turnToward = (heading: number, desired: number, maxStep: number) =>
  norm(heading + Math.max(-maxStep, Math.min(maxStep, delta(heading, desired))))

/** Straight-line tracks that fly past this range come back on the far side, like the next aircraft on the airway. */
const WRAP_NM = 190
/** A probing hostile turns away on its own here; the fighter assignment closes when it is back out past this. */
const TURN_AWAY_NM = 22
const RELEASE_NM = 60
const REPROBE_NM = 95

interface SimTrack {
  id: string
  callsign: string | null
  kind: TrackKind
  type: string
  x: number
  y: number
  heading: number
  speed: number
  altitude: number
  vrate: number
  mode: TrackMode
  turnRate: number
  /** Orbit centre and radius, kept so a fighter can fly back to its CAP. */
  cap: { x: number; y: number; radius: number } | null
  source: string
  iff: string
  period: number
  offset: number
}

export interface TrackView {
  id: string
  callsign: string | null
  kind: TrackKind
  type: string
  mode: TrackMode
  source: string
  iff: string
  bearing: number
  range: number
  heading: number
  speed: number
  altitude: number
  vrate: number
  /** Knots toward the CRC; negative when opening. */
  closure: number
  /** Seconds until overhead the CRC at the current closure, or null when not closing. */
  timeToCrc: number | null
  /** Seconds since the last plot. */
  age: number
  inside: boolean
}

export interface Assignment {
  fighter: string
  target: string
  at: number
  inSight: boolean
}

function seedTrack(seed: (typeof trackSeeds)[number]): SimTrack {
  let x = 0
  let y = 0
  let heading = 0
  let cap: SimTrack['cap'] = null
  let turnRate = 0
  if (seed.orbit) {
    const centre = toXY(seed.orbit.bearing, seed.orbit.range)
    turnRate = seed.orbit.turnRate
    // A steady right-hand turn: radius = speed / rate of turn.
    const radius = seed.speed / 3600 / (turnRate * RAD)
    const p = toXY(seed.orbit.phase, radius)
    x = centre.x + p.x
    y = centre.y + p.y
    heading = norm(seed.orbit.phase + 90)
    cap = { ...centre, radius }
  } else if (seed.at) {
    const p = toXY(seed.at.bearing, seed.at.range)
    x = p.x
    y = p.y
    heading = seed.at.heading
  }
  return {
    id: seed.id,
    callsign: seed.callsign,
    kind: seed.kind,
    type: seed.type,
    x,
    y,
    heading,
    speed: seed.speed,
    altitude: seed.altitude,
    vrate: seed.vrate,
    mode: seed.mode,
    turnRate,
    cap,
    source: seed.source,
    iff: seed.iff,
    period: seed.period,
    offset: seed.offset,
  }
}

export function useAirPicture() {
  const opened = Date.now()
  const now = ref(opened)
  const elapsed = ref(0)
  const sim = reactive<SimTrack[]>(trackSeeds.map(seedTrack))
  const assignment = ref<Assignment | null>(null)

  let seq = 0
  const log = ref<LogEntry[]>(logSeeds.map(({ ago, ...entry }) => ({ ...entry, id: ++seq, at: opened - ago * 1000 })))

  function write(entry: Omit<LogEntry, 'id' | 'at'>) {
    log.value = [{ ...entry, id: ++seq, at: Date.now() }, ...log.value].slice(0, 14)
  }

  const byId = (id: string) => sim.find((t) => t.id === id)
  const rangeOf = (t: SimTrack) => Math.hypot(t.x, t.y)

  // Which hostile and unknown tracks are inside the alert ring, to log the crossings.
  const inside = new Map(sim.map((t) => [t.id, rangeOf(t) <= ALERT_RING_NM]))

  function steer(t: SimTrack, dt: number) {
    switch (t.mode) {
      case 'orbit':
        t.heading = norm(t.heading + t.turnRate * dt)
        t.speed = approach(t.speed, t.kind === 'friendly' && t.callsign?.startsWith('TALON') ? 420 : t.speed, 8 * dt)
        break
      case 'probe':
        t.heading = turnToward(t.heading, bearingOf(-t.x, -t.y), 2 * dt)
        t.speed = approach(t.speed, 480, 8 * dt)
        t.vrate = t.altitude > 8000 ? -1200 : 0
        break
      case 'withdraw':
        t.heading = turnToward(t.heading, bearingOf(t.x, t.y), 2 * dt)
        t.speed = approach(t.speed, 520, 8 * dt)
        t.vrate = t.altitude < 25000 ? 2500 : 0
        break
      case 'intercept': {
        const target = assignment.value ? byId(assignment.value.target) : undefined
        if (!target) break
        // Lead pursuit: aim where the target will be when the two meet.
        const dist = Math.hypot(target.x - t.x, target.y - t.y)
        const tgo = dist / 1000
        const aimX = target.x + target.speed * Math.sin(target.heading * RAD) * tgo
        const aimY = target.y + target.speed * Math.cos(target.heading * RAD) * tgo
        t.heading = turnToward(t.heading, bearingOf(aimX - t.x, aimY - t.y), 3 * dt)
        t.speed = approach(t.speed, 540, 10 * dt)
        t.vrate = Math.abs(target.altitude - t.altitude) > 300 ? Math.sign(target.altitude - t.altitude) * 3000 : 0
        break
      }
      case 'shadow': {
        const target = assignment.value ? byId(assignment.value.target) : undefined
        if (!target) break
        // Sit 3 NM astern of the target.
        const sx = target.x - 3 * Math.sin(target.heading * RAD)
        const sy = target.y - 3 * Math.cos(target.heading * RAD)
        const gap = Math.hypot(sx - t.x, sy - t.y)
        t.heading = turnToward(t.heading, gap < 0.6 ? target.heading : bearingOf(sx - t.x, sy - t.y), 3 * dt)
        t.speed = approach(t.speed, Math.max(300, Math.min(560, target.speed + gap * 40)), 10 * dt)
        t.vrate = Math.abs(target.altitude - t.altitude) > 300 ? Math.sign(target.altitude - t.altitude) * 3000 : 0
        break
      }
      case 'return': {
        const cap = t.cap
        if (!cap) {
          t.mode = 'cruise'
          break
        }
        t.heading = turnToward(t.heading, bearingOf(cap.x - t.x, cap.y - t.y), 3 * dt)
        t.speed = approach(t.speed, 450, 8 * dt)
        t.vrate = t.altitude > 24500 ? -2000 : t.altitude < 23500 ? 2000 : 0
        if (Math.hypot(cap.x - t.x, cap.y - t.y) < cap.radius * 1.2) {
          t.mode = 'orbit'
          write({ title: `${t.callsign ?? t.id} back on CAP South`, meta: WEAPONS_DIRECTOR, tone: 'success' })
        }
        break
      }
      case 'cruise':
        break
    }
  }

  function move(t: SimTrack, dt: number) {
    const step = (t.speed / 3600) * dt
    t.x += step * Math.sin(t.heading * RAD)
    t.y += step * Math.cos(t.heading * RAD)
    t.altitude = Math.max(500, Math.min(45000, t.altitude + (t.vrate / 60) * dt))
    if (t.mode === 'cruise' && rangeOf(t) > WRAP_NM) {
      const back = toXY(bearingOf(t.x, t.y) + 180, WRAP_NM - 5)
      t.x = back.x
      t.y = back.y
    }
  }

  function events() {
    for (const t of sim) {
      const r = rangeOf(t)
      // The hostile's probe: it turns away at 22 NM by itself and comes back from 95 NM.
      if (t.kind === 'hostile' && t.mode === 'probe' && r < TURN_AWAY_NM) {
        t.mode = 'withdraw'
        write({ title: `${t.id} turned away at ${TURN_AWAY_NM} NM`, body: 'Heading outbound and climbing.', meta: t.source, tone: 'success' })
      } else if (t.kind === 'hostile' && t.mode === 'withdraw' && r > REPROBE_NM && assignment.value?.target !== t.id) {
        t.mode = 'probe'
        write({ title: `${t.id} turned inbound again`, body: `Bearing ${bearingText(bearingOf(t.x, t.y))}, ${Math.round(r)} NM.`, meta: t.source, tone: 'warning' })
      }
      if (t.kind !== 'hostile' && t.kind !== 'unknown') continue
      const isInside = r <= ALERT_RING_NM
      if (isInside !== inside.get(t.id)) {
        inside.set(t.id, isInside)
        const word = t.kind === 'hostile' ? 'Hostile' : 'Unknown'
        write(
          isInside
            ? {
                title: `${t.id} entered the ${ALERT_RING_NM} NM ring`,
                body: `${word}, bearing ${bearingText(bearingOf(t.x, t.y))}, ${Math.round(t.speed)} kn.`,
                meta: t.source,
                tone: t.kind === 'hostile' ? 'signal' : 'warning',
              }
            : {
                title: `${t.id} left the ${ALERT_RING_NM} NM ring`,
                body: `${word}, outbound on ${bearingText(t.heading)}.`,
                meta: t.source,
                tone: 'success',
              },
        )
      }
    }

    const a = assignment.value
    if (!a) return
    const fighter = byId(a.fighter)
    const target = byId(a.target)
    if (!fighter || !target) {
      assignment.value = null
      return
    }
    const dist = Math.hypot(target.x - fighter.x, target.y - fighter.y)
    if (!a.inSight && dist < 5) {
      assignment.value = { ...a, inSight: true }
      fighter.mode = 'shadow'
      write({
        title: `${fighter.callsign} has ${target.id} in sight`,
        body: `Visual at ${dist.toFixed(1)} NM. Shadowing from 3 NM astern.`,
        meta: WEAPONS_DIRECTOR,
        tone: 'brand',
      })
      if (target.mode === 'probe') {
        target.mode = 'withdraw'
        write({ title: `${target.id} turning away`, body: 'Heading outbound and climbing.', meta: target.source, tone: 'success' })
      }
    }
    if (target.mode === 'withdraw' && rangeOf(target) > RELEASE_NM) {
      fighter.mode = 'return'
      assignment.value = null
      write({
        title: `${fighter.callsign} returning to CAP South`,
        body: `${target.id} outbound at ${Math.round(rangeOf(target))} NM. Assignment closed.`,
        meta: WEAPONS_DIRECTOR,
      })
    }
  }

  let last = opened
  function tick() {
    const t = Date.now()
    const dt = Math.min(5, (t - last) / 1000)
    last = t
    now.value = t
    elapsed.value = Math.floor((t - opened) / 1000)
    for (const track of sim) steer(track, dt)
    for (const track of sim) move(track, dt)
    events()
  }

  let timer = 0
  onMounted(() => {
    timer = window.setInterval(tick, 1000)
  })
  onBeforeUnmount(() => window.clearInterval(timer))

  const tracks = computed<TrackView[]>(() =>
    sim.map((t) => {
      const range = Math.hypot(t.x, t.y)
      const vx = t.speed * Math.sin(t.heading * RAD)
      const vy = t.speed * Math.cos(t.heading * RAD)
      const closure = range > 0.05 ? -(t.x * vx + t.y * vy) / range : 0
      return {
        id: t.id,
        callsign: t.callsign,
        kind: t.kind,
        type: t.type,
        mode: t.mode,
        source: t.source,
        iff: t.iff,
        bearing: bearingOf(t.x, t.y),
        range,
        heading: t.heading,
        speed: t.speed,
        altitude: t.altitude,
        vrate: t.vrate,
        closure,
        timeToCrc: closure > 30 ? (range / closure) * 3600 : null,
        age: (elapsed.value + t.offset) % t.period,
        inside: range <= ALERT_RING_NM,
      }
    }),
  )

  /** Sends the nearest fighter on CAP after the target. Returns what to tell the crew, or null. */
  function assign(targetId: string) {
    const target = byId(targetId)
    if (!target || assignment.value) return null
    const fighters = sim
      .filter((t) => t.callsign?.startsWith('TALON') && t.mode === 'orbit')
      .map((t) => ({ t, dist: Math.hypot(target.x - t.x, target.y - t.y) }))
      .sort((a, b) => a.dist - b.dist)
    const pick = fighters[0]
    if (!pick) return null
    const { t: fighter, dist } = pick
    const vector = bearingOf(target.x - fighter.x, target.y - fighter.y)
    // Closure along the line of sight: the fighter at 540 kn, plus or minus the target's own motion.
    const ux = (target.x - fighter.x) / dist
    const uy = (target.y - fighter.y) / dist
    const away = target.speed * (Math.sin(target.heading * RAD) * ux + Math.cos(target.heading * RAD) * uy)
    const seconds = (dist / Math.max(120, 540 - away)) * 3600
    fighter.mode = 'intercept'
    assignment.value = { fighter: fighter.id, target: target.id, at: Date.now(), inSight: false }
    const result = {
      fighter: fighter.callsign ?? fighter.id,
      target: target.id,
      vector: bearingText(vector),
      distance: dist.toFixed(1),
      time: clockText(seconds),
    }
    write({
      title: `${result.fighter} assigned to ${target.id}`,
      body: `Vector ${result.vector}, ${result.distance} NM, intercept in about ${result.time}.`,
      meta: WEAPONS_DIRECTOR,
      tone: 'brand',
    })
    return result
  }

  return { now, elapsed, opened, tracks, log, assignment, assign }
}
