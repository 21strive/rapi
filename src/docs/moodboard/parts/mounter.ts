/**
 * Mounting a specimen costs a few milliseconds. Scrolling fast (or zooming the board out) brings
 * dozens of tiles near the screen at once, so mounts wait in a queue and run a few per frame, within
 * a time budget, tiles already on screen first. The budget is measured around Vue's own render:
 * after each mount, `nextTick` lets Vue patch the DOM before the clock is read again.
 */
import { nextTick } from 'vue'

type Job = () => void

const BUDGET_MS = 10
const urgent: Job[] = []
const soon: Job[] = []
const done = new WeakSet<Job>()
let running = false

async function flush() {
  const start = performance.now()
  while (performance.now() - start < BUDGET_MS) {
    const job = urgent.shift() ?? soon.shift()
    if (!job) break
    if (done.has(job)) continue
    done.add(job)
    job()
    await nextTick()
  }
  if (urgent.length || soon.length) requestAnimationFrame(() => void flush())
  else running = false
}

/** Queue a mount. `onScreen` puts it ahead of tiles that are only near the screen. */
export function scheduleMount(job: Job, onScreen = false) {
  if (done.has(job)) return
  ;(onScreen ? urgent : soon).push(job)
  if (!running) {
    running = true
    requestAnimationFrame(() => void flush())
  }
}
