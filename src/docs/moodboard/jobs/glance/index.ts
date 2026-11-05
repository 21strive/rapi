import { archetype, walk, wave } from '../../kit'
import type { MoodEntry } from '../../types'
import AirQuality from './AirQuality.vue'
import BalanceHide from './BalanceHide.vue'
import CapacityRing from './CapacityRing.vue'
import Compass from './Compass.vue'
import DialGauge from './DialGauge.vue'
import FigureSpark from './FigureSpark.vue'
import GoalProgress from './GoalProgress.vue'
import HealthMatrix from './HealthMatrix.vue'
import HoursStrip from './HoursStrip.vue'
import KpiRow from './KpiRow.vue'
import LcdReadout from './LcdReadout.vue'
import LedLevel from './LedLevel.vue'
import NextUp from './NextUp.vue'
import Presence from './Presence.vue'
import QueueCounts from './QueueCounts.vue'
import RangeCell from './RangeCell.vue'
import RateTile from './RateTile.vue'
import SignalBars from './SignalBars.vue'
import SpecMini from './SpecMini.vue'
import StatusLamp from './StatusLamp.vue'
import UptimeStrip from './UptimeStrip.vue'
import ValueInBand from './ValueInBand.vue'
import WeatherGlance from './WeatherGlance.vue'
import ZoneClock from './ZoneClock.vue'
import ZoneStrip from './ZoneStrip.vue'
import { bank, daily } from './shared'

/* ── Patterns ────────────────────────────────────────────────────────────────────────── */

const figure = archetype(FigureSpark, {
  name: 'Figure with its shape',
  hint: 'Switch the period, or run the pointer along the line',
  why: 'One number and its recent shape answer “how are we doing” before the question is typed.',
  tags: ['figure', 'number', 'sparkline', 'kpi', 'trend'],
})

const lamp = archetype(StatusLamp, {
  name: 'Status lamp',
  hint: 'Press the tile, or use the arrow keys, to step through the systems',
  why: 'A lamp and a word say whether a system is fine faster than a status query can be typed.',
  tags: ['status', 'lamp', 'state', 'system'],
})

const lcd = archetype(LcdReadout, {
  name: 'Readout with units',
  hint: 'Switch the unit with the keys under the figure',
  why: 'An instrument figure reads in a glance; the unit keys spare a conversion that would otherwise be a question.',
  tags: ['readout', 'lcd', 'unit', 'instrument'],
})

const dial = archetype(DialGauge, {
  name: 'Dial with zones',
  hint: 'Switch the unit with the keys; the needle and the zone word follow',
  why: 'Where a needle sits against its red line is seen before a number could be read out.',
  tags: ['dial', 'gauge', 'zone', 'instrument'],
})

const led = archetype(LedLevel, {
  name: 'LED level',
  hint: 'Switch the channel with the keys, or press a channel row',
  why: 'A row of lit blocks shows how full something is the way a desk or a fuel panel does: no reading needed.',
  tags: ['level', 'meter', 'led', 'segments'],
})

const ring = archetype(CapacityRing, {
  name: 'Capacity ring',
  hint: 'Switch the site; focus the ring and use the arrow keys to read each part',
  why: 'How full a place is, and with what, is one shape; as a sentence it is three numbers and a sum.',
  tags: ['capacity', 'gauge', 'occupancy'],
})

const clock = archetype(ZoneClock, {
  name: 'Zone clock',
  hint: 'Press the clock, or use the arrow keys, to step to the next place',
  why: 'The time somewhere else is a look, not a sum with offsets and dates.',
  tags: ['clock', 'time', 'zone'],
})

const desks = archetype(ZoneStrip, {
  name: 'Desks across zones',
  hint: 'Pick a desk to make it home; the arrow keys move between desks',
  why: 'Who is open right now, four zones away, is one look at a strip instead of four sums.',
  tags: ['clock', 'zones', 'hours', 'open'],
})

const balance = archetype(BalanceHide, {
  name: 'Balance, hidden on demand',
  hint: 'Press Show or Hide; on the peek tile, press and hold',
  why: 'A balance is checked in a look, and hidden in one press when someone else can see the screen.',
  tags: ['balance', 'money', 'privacy'],
})

const uptime = archetype(UptimeStrip, {
  name: 'Ninety days',
  hint: 'Point at a day, or focus the squares and use the arrow keys; a click pins a day',
  why: 'Ninety days of good and bad read as one picture, and the bad days find the eye on their own.',
  tags: ['uptime', 'history', 'status', 'days'],
})

const matrix = archetype(HealthMatrix, {
  name: 'Health matrix',
  hint: 'Press a cell, or use the arrow keys, to read it',
  why: 'The one unit in twenty-four that is down stands out across a room; asking for it means already knowing.',
  tags: ['lamps', 'grid', 'fleet', 'status'],
})

const kpis = archetype(KpiRow, {
  name: 'KPI row',
  hint: 'Press a figure, or use the arrow keys, to see its shape and target',
  why: 'The morning numbers side by side, with their change, are read in one sweep of the eye.',
  tags: ['kpi', 'figures', 'ruled'],
})

const range = archetype(RangeCell, {
  name: 'Charge and range',
  hint: 'Switch the mode to see what the charge still covers',
  why: '“Will it make it?” is answered by a cell and a distance, not by a percentage and some arithmetic.',
  tags: ['battery', 'range', 'ev', 'charge'],
})

const weather = archetype(WeatherGlance, {
  name: 'Weather by the hour',
  hint: 'Run the pointer along the hours, or focus them and use the arrow keys',
  why: 'Twelve hours of rain are one shape; read aloud they are twelve numbers.',
  tags: ['weather', 'rain', 'wind', 'forecast'],
})

const air = archetype(AirQuality, {
  name: 'Air quality',
  hint: 'Switch the reading with the keys; on the small tile, press to step',
  why: 'Where a reading falls between good and hazardous is a band and a word, quicker than any index explained.',
  tags: ['air', 'pm2.5', 'band', 'environment'],
})

const signal = archetype(SignalBars, {
  name: 'Signal strength',
  hint: 'Press Test link to measure again; switch the link with the keys',
  why: 'Bars are the signal readout everyone already reads; the figure is there for whoever needs it.',
  tags: ['signal', 'link', 'radio', 'bars'],
})

const heading = archetype(Compass, {
  name: 'Heading',
  hint: 'Switch the reference, the hour or the runway with the keys',
  why: 'A direction is a picture: a card and an arrow beat “two four seven degrees” read aloud.',
  tags: ['compass', 'heading', 'wind', 'direction'],
})

const next = archetype(NextUp, {
  name: 'Next up',
  hint: 'Page through the day with the arrows; press the action to record it, with undo',
  why: 'What comes next, and how soon, should be on screen before anyone thinks to ask.',
  tags: ['next', 'schedule', 'countdown'],
})

const presence = archetype(Presence, {
  name: 'Who’s in',
  hint: 'Press a face, or use the arrow keys, to see where they are',
  why: 'Faces with a lamp say who is around in one look; a roll call takes a minute.',
  tags: ['presence', 'people', 'team'],
})

const goal = archetype(GoalProgress, {
  name: 'Progress to a goal',
  hint: 'Flip the figure between done and left with the keys',
  why: 'A bar with a pace mark says whether a goal will be met; the sentence needs a division and a date.',
  tags: ['goal', 'progress', 'budget', 'pace'],
})

const rate = archetype(RateTile, {
  name: 'Rate',
  hint: 'Press the swap key to turn the quote around',
  why: 'A rate quoted the way the reader thinks spares a division done in the head.',
  tags: ['fx', 'rate', 'price'],
})

const spec = archetype(SpecMini, {
  name: 'Spec sheet',
  hint: 'Press a value with a copy mark to copy it',
  why: 'The few facts people look up about a thing, laid out to be read and copied, never retyped.',
  tags: ['spec', 'datasheet', 'copy'],
})

const queue = archetype(QueueCounts, {
  name: 'Queue by severity',
  hint: 'Press a severity, or use the arrow keys, to see its oldest item',
  why: 'How bad, and how late, by severity is the whole state of a queue in one row.',
  tags: ['queue', 'severity', 'triage', 'counts'],
})

const band = archetype(ValueInBand, {
  name: 'Reading in its band',
  hint: 'Switch the reading with the keys; in the list, press a row',
  why: 'A mark inside or outside the drawn normal band answers “is that high?” without a reference card.',
  tags: ['reading', 'range', 'normal', 'vitals'],
})

const hours = archetype(HoursStrip, {
  name: 'Today by the hour',
  hint: 'Point at an hour, or focus the strip and use the arrow keys; Now returns',
  why: 'What now means (peak, closed, busy) and when it changes is one strip with a line through it.',
  tags: ['hours', 'today', 'now', 'schedule'],
})

/* ── Shared data ─────────────────────────────────────────────────────────────────────── */

type AqLevel = 'good' | 'warning' | 'serious' | 'critical' | 'hazard'
const bands = (edges: number[], words = ['Good', 'Moderate', 'Unhealthy', 'Very unhealthy', 'Hazardous']) => {
  const levels: AqLevel[] = ['good', 'warning', 'serious', 'critical', 'hazard']
  return words.map((word, i) => ({ upTo: edges[i] ?? Number.MAX_SAFE_INTEGER, word, level: levels[i] }))
}
/* Indonesian ISPU breakpoints, µg/m³. */
const PM25 = bands([15.5, 55.4, 150.4, 250.4])
const PM10 = bands([50, 150, 350, 420])
const O3 = bands([120, 235, 400, 800])
const SO2 = bands([52, 180, 400, 800])
const NO2 = bands([80, 200, 1130, 2260])
const CO2 = bands([800, 1200, 2000], ['Fresh', 'Stuffy soon', 'Open a window', 'Leave the room'])

const usdIdr = walk('glance-usd-idr', 30, 16120, 0.004, { drift: 0.07, decimals: 2 })
usdIdr[usdIdr.length - 1] = 16284.5
const cpoKg = walk('glance-cpo-kg', 30, 15240, 0.01, { drift: -0.08, decimals: 0 })
cpoKg[cpoKg.length - 1] = 14820
const cpoT = walk('glance-cpo-t', 30, 4330, 0.01, { drift: -0.07, decimals: 0 })
cpoT[cpoT.length - 1] = 4212

/* ── Variants ────────────────────────────────────────────────────────────────────────── */

const v = {
  /* Figure with its shape: the lead's three, then two more. */
  figureCash: figure({
    id: 'glance-figure-cash',
    size: '2x2',
    domain: 'banking',
    props: {
      label: 'Cash position',
      format: 'idr',
      note: 'Across 14 accounts in 3 currencies',
      periods: [
        { id: '7d', label: '7D', values: walk('glance-cash-7', 7, 4.62e12, 0.012, { drift: 0.1 }), delta: 1.9 },
        { id: '30d', label: '30D', values: walk('glance-cash-30', 30, 4.31e12, 0.018, { drift: 0.12 }), delta: 7.4 },
        { id: '90d', label: '90D', values: walk('glance-cash-90', 45, 3.98e12, 0.02, { drift: 0.15 }), delta: 16.2 },
      ],
    },
  }),
  figureP95: figure({
    id: 'glance-figure-p95',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    props: {
      label: 'p95 latency · api-gateway',
      unit: 'ms',
      invert: true,
      note: 'ap-southeast-3, all routes',
      periods: [
        { id: '1h', label: '1H', values: walk('glance-p95-1h', 30, 182, 0.08, { min: 120 , decimals: 0 }), delta: -4.2 },
        { id: '24h', label: '24H', values: walk('glance-p95-24h', 48, 210, 0.07, { min: 120, drift: -0.08, decimals: 0 }), delta: -11.8 },
      ],
    },
  }),
  figureRiders: figure({
    id: 'glance-figure-riders',
    size: '2x2',
    domain: 'transit',
    props: {
      label: 'Riders today',
      note: 'Gates on 13 stations, updated 14:02 WIB',
      periods: [
        { id: 'today', label: 'Today', values: [820, 4100, 18200, 31400, 27900, 21200, 19800, 22100, 30800, 44800, 52100, 61240], delta: 3.1 },
        { id: 'week', label: 'Week', values: [352000, 361400, 349800, 371200, 388900, 214500, 168200], delta: -1.4 },
      ],
    },
  }),
  figureSolar: figure({
    id: 'glance-figure-solar',
    size: '2x2',
    domain: 'energy',
    surface: 'muted',
    name: 'Yield with its shape',
    props: {
      label: 'Solar yield · rooftop, Cikarang',
      unit: 'kWh',
      note: '1.2 MWp array · clear sky until 15:00 WIB',
      periods: [
        { id: 'today', label: 'Today', values: [0, 38, 160, 410, 760, 1150, 1540, 1890, 2140, 2310], delta: 6.2 },
        { id: '7d', label: '7D', values: [5120, 4870, 5480, 3920, 5610, 5340, 4980], delta: -2.7 },
      ],
    },
  }),
  figureSubscribers: figure({
    id: 'glance-figure-subscribers',
    size: '1x2',
    domain: 'media',
    props: {
      label: 'Paid subscribers',
      note: 'Digital edition, all plans',
      periods: [
        { id: '30d', label: '30D', values: walk('glance-subs-30', 30, 46800, 0.004, { drift: 0.14, decimals: 0 }), delta: 2.9 },
        { id: '12m', label: '12M', values: walk('glance-subs-12', 12, 39200, 0.02, { drift: 0.22, decimals: 0 }), delta: 22.4 },
      ],
    },
  }),

  /* Status lamp */
  lampServices: lamp({
    id: 'glance-lamp-services',
    size: '1x1',
    domain: 'devops',
    props: {
      group: 'Services',
      start: 2,
      systems: [
        { name: 'api-gateway', status: 'Nominal', tone: 'success', meta: 'p95 182 ms', mono: true },
        { name: 'payments-core', status: 'Nominal', tone: 'success', meta: '1,284 req/s', mono: true },
        { name: 'ledger', status: 'Degraded', tone: 'warning', meta: 'p95 412 ms since 13:48 WIB', mono: true },
        { name: 'auth', status: 'Nominal', tone: 'success', meta: 'Errors 0.02%', mono: true },
        { name: 'notifications', status: 'Maintenance', tone: 'neutral', meta: 'Until 15:00 WIB', mono: true },
        { name: 'risk-engine', status: 'Nominal', tone: 'success', meta: '12 jobs queued', mono: true },
      ],
    },
  }),
  lampStations: lamp({
    id: 'glance-lamp-stations',
    size: '1x1',
    domain: 'aerospace',
    surface: 'dark',
    props: {
      group: 'Ground stations',
      systems: [
        { name: 'Biak', status: 'Tracking', tone: 'success', meta: 'NUSA-SAT 2 · el 41°', live: true },
        { name: 'Rumpin', status: 'Standby', tone: 'neutral', meta: 'Next pass 15:12 WIB' },
        { name: 'Parepare', status: 'Tracking', tone: 'success', meta: 'NUSA-SAT 1 · el 18°', live: true },
        { name: 'Pontianak', status: 'No link', tone: 'danger', meta: 'Since 13:41 WIB' },
        { name: 'Kupang', status: 'Standby', tone: 'neutral', meta: 'Next pass 15:58 WITA' },
      ],
    },
  }),
  lampDoors: lamp({
    id: 'glance-lamp-doors',
    size: '1x1',
    domain: 'home',
    surface: 'muted',
    name: 'Doors and windows',
    props: {
      group: 'House',
      start: 1,
      systems: [
        { name: 'Front door', status: 'Locked', tone: 'success', meta: 'Since 08:12 WIB' },
        { name: 'Garage', status: 'Open', tone: 'warning', meta: 'Open for 25 min' },
        { name: 'Back door', status: 'Locked', tone: 'success', meta: 'Since 21:40 WIB yesterday' },
        { name: 'Gate', status: 'Closed', tone: 'success', meta: 'Last opened 07:55 WIB' },
        { name: 'Bedroom 2 window', status: 'Open', tone: 'warning', meta: 'Rain from 16:00 WIB' },
      ],
    },
  }),
  lampLines: lamp({
    id: 'glance-lamp-lines',
    size: '1x1',
    domain: 'transit',
    name: 'Line status',
    props: {
      group: 'Commuter lines',
      systems: [
        { name: 'Bogor line', status: 'Normal', tone: 'success', meta: 'Every 6 min' },
        { name: 'Cikarang line', status: 'Delays', tone: 'warning', meta: 'About 10 min, signal fault' },
        { name: 'Serpong line', status: 'Normal', tone: 'success', meta: 'Every 12 min' },
        { name: 'Tangerang line', status: 'Normal', tone: 'success', meta: 'Every 10 min' },
        { name: 'Priok line', status: 'Reduced', tone: 'warning', meta: 'Every 30 min until 16:00 WIB' },
      ],
    },
  }),
  lampFeeders: lamp({
    id: 'glance-lamp-feeders',
    size: '1x1',
    domain: 'energy',
    surface: 'dark',
    name: 'Feeder state',
    props: {
      group: 'GI Cawang',
      start: 1,
      systems: [
        { name: 'CWG-07', status: 'Energised', tone: 'success', meta: 'Load 18.4 MW', mono: true },
        { name: 'CWG-08', status: 'Tripped', tone: 'danger', meta: 'Earth fault 13:52 WIB', mono: true },
        { name: 'CWG-09', status: 'Energised', tone: 'success', meta: 'Load 12.1 MW', mono: true },
        { name: 'CWG-10', status: 'Off for works', tone: 'neutral', meta: 'Until 17:00 WIB', mono: true },
        { name: 'CWG-11', status: 'Energised', tone: 'success', meta: 'Load 9.7 MW', mono: true },
      ],
    },
  }),

  /* Readout with units */
  lcdColdroom: lcd({
    id: 'glance-lcd-coldroom',
    size: '2x1',
    domain: 'logistics',
    surface: 'dark',
    name: 'Cold room readout',
    props: {
      label: 'Cold room 3 · Cikarang DC',
      font: 'pixel',
      tone: 'success',
      meta: 'Frozen',
      views: [
        { unit: '°C', value: -18.4, decimals: 1, sub: 'SET −18.0 · BAND ±2.0 · IN RANGE' },
        { unit: '°F', value: -1.1, decimals: 1, sub: 'SET −0.4 · BAND ±3.6 · IN RANGE' },
      ],
    },
  }),
  lcdWind: lcd({
    id: 'glance-lcd-wind',
    size: '1x1',
    domain: 'aerospace',
    name: 'Wind readout',
    props: {
      label: 'Wind · DPS 09',
      views: [
        { unit: 'kn', value: 14, sub: 'FROM 110° · GUST 22' },
        { unit: 'km/h', value: 26, sub: 'FROM 110° · GUST 41' },
        { unit: 'm/s', value: 7.2, decimals: 1, sub: 'FROM 110° · GUST 11.3' },
      ],
    },
  }),
  lcdRain: lcd({
    id: 'glance-lcd-rain',
    size: '1x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Rain gauge',
    props: {
      label: 'Rain today · Blok C',
      font: 'sans',
      views: [
        { unit: 'mm', value: 38, sub: 'SINCE 00:00 WIB' },
        { unit: 'in', value: 1.5, decimals: 2, sub: 'SINCE 00:00 WIB' },
      ],
    },
  }),
  lcdTempo: lcd({
    id: 'glance-lcd-tempo',
    size: '1x1',
    domain: 'audio',
    name: 'Tempo readout',
    props: {
      label: 'Tempo · Studio B',
      font: 'pixel',
      views: [
        { unit: 'BPM', value: 128, sub: 'QUARTER NOTE' },
        { unit: 'ms', value: 469, sub: 'PER BEAT · DELAY 1/4' },
        { unit: 'Hz', value: 2.13, decimals: 2, sub: 'LFO SYNC 1/4' },
      ],
    },
  }),

  /* Dial with zones */
  dialOil: dial({
    id: 'glance-dial-oil',
    size: '2x2',
    domain: 'energy',
    surface: 'dark',
    name: 'Transformer oil dial',
    props: {
      label: 'Transformers · GI Cawang',
      measure: 'Top oil',
      unit: '°C',
      min: 0,
      max: 120,
      majorStep: 20,
      zones: [
        { from: 0, to: 75, level: 'good' },
        { from: 75, to: 95, level: 'warning' },
        { from: 95, to: 120, level: 'critical' },
      ],
      sources: [
        { id: 't1', label: 'T1', value: 61, note: 'Load 64%' },
        { id: 't2', label: 'T2', value: 82, note: 'Load 91%' },
        { id: 't3', label: 'T3', value: 54, note: 'Load 48%' },
      ],
    },
  }),
  dialPressure: dial({
    id: 'glance-dial-pressure',
    size: '2x2',
    domain: 'civic',
    name: 'Mains pressure dial',
    props: {
      label: 'Mains pressure · Surabaya',
      measure: 'Pressure',
      unit: 'bar',
      min: 0,
      max: 6,
      majorStep: 1,
      decimals: 1,
      zones: [
        { from: 0, to: 1.5, level: 'critical' },
        { from: 1.5, to: 2, level: 'warning' },
        { from: 2, to: 4, level: 'good' },
        { from: 4, to: 5, level: 'warning' },
        { from: 5, to: 6, level: 'critical' },
      ],
      sources: [
        { id: 'rkt', label: 'Rungkut', value: 2.6, note: 'Zone 4' },
        { id: 'wkr', label: 'Wonokromo', value: 1.7, note: 'Zone 2' },
        { id: 'tgs', label: 'Tegalsari', value: 3.1, note: 'Zone 1' },
      ],
    },
  }),
  dialN1: dial({
    id: 'glance-dial-n1',
    size: '1x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Engine dial',
    props: {
      label: 'Engines · PK-NSA',
      measure: 'N1',
      unit: '%',
      min: 0,
      max: 110,
      majorStep: 20,
      decimals: 1,
      size: 150,
      zones: [
        { from: 0, to: 98, level: 'good' },
        { from: 98, to: 102, level: 'warning' },
        { from: 102, to: 110, level: 'critical' },
      ],
      sources: [
        { id: 'e1', label: 'Eng 1', value: 84.2, note: 'EGT 612 °C' },
        { id: 'e2', label: 'Eng 2', value: 84.6, note: 'EGT 618 °C' },
      ],
    },
  }),
  dialFirewall: dial({
    id: 'glance-dial-firewall',
    size: '1x2',
    domain: 'security',
    surface: 'muted',
    name: 'Firewall load dial',
    props: {
      label: 'Firewall · fw-edge',
      measure: 'CPU',
      unit: '%',
      min: 0,
      max: 100,
      majorStep: 25,
      size: 150,
      zones: [
        { from: 0, to: 70, level: 'good' },
        { from: 70, to: 90, level: 'warning' },
        { from: 90, to: 100, level: 'critical' },
      ],
      sources: [
        { id: 'a', label: 'Node A', value: 47, note: '2.1 Gbit/s' },
        { id: 'b', label: 'Node B', value: 76, note: '3.4 Gbit/s' },
      ],
    },
  }),

  /* LED level */
  ledLoudness: led({
    id: 'glance-led-loudness',
    size: '2x2',
    domain: 'audio',
    surface: 'dark',
    name: 'Loudness meter',
    props: {
      label: 'Loudness · programme out',
      unit: 'LUFS',
      min: -36,
      max: 0,
      count: 36,
      mode: 'stack',
      orientation: 'column',
      decimals: 1,
      target: -14,
      ends: ['−36', '0'],
      start: 2,
      channels: [
        { id: 'm', label: 'M', name: 'Momentary', value: -10.9, note: 'Momentary, the last 400 ms' },
        { id: 's', label: 'S', name: 'Short-term', value: -12.8, note: 'Short-term, the last 3 s' },
        { id: 'i', label: 'I', name: 'Integrated', value: -14.2, note: 'Integrated since 19:00 WIB, target −14' },
      ],
      bands: [
        { upTo: -15, tone: 'neutral', word: 'Under target' },
        { upTo: -13, tone: 'success', word: 'On target' },
        { upTo: 0, tone: 'warning', word: 'Over target' },
      ],
    },
  }),
  ledDisk: led({
    id: 'glance-led-disk',
    size: '2x1',
    domain: 'devops',
    name: 'Disk level',
    props: {
      label: 'Disk · ledger database',
      unit: '%',
      max: 100,
      count: 25,
      target: 85,
      ends: ['0', '100%'],
      channels: [
        { id: 'db1', label: 'db-01', value: 78, note: '1.56 of 2 TB · full in about 41 days' },
        { id: 'db2', label: 'db-02', value: 64, note: '1.28 of 2 TB' },
        { id: 'db3', label: 'db-03', value: 91, note: '1.82 of 2 TB · full in about 9 days' },
      ],
      bands: [
        { upTo: 70, tone: 'neutral', word: 'OK' },
        { upTo: 85, tone: 'warning', word: 'Watch' },
        { upTo: 100, tone: 'danger', word: 'Full soon' },
      ],
    },
  }),
  ledFuel: led({
    id: 'glance-led-fuel',
    size: '3x1',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Fuel tanks',
    props: {
      label: 'Fuel · PK-NSA · 8,410 kg on board',
      unit: '%',
      max: 100,
      count: 30,
      mode: 'stack',
      channels: [
        { id: 'l', label: 'Left', value: 80, note: '3,120 of 3,900 kg' },
        { id: 'c', label: 'Centre', value: 34, note: '2,210 of 6,500 kg' },
        { id: 'r', label: 'Right', value: 79, note: '3,080 of 3,900 kg' },
      ],
      bands: [
        { upTo: 15, tone: 'danger', word: 'Low' },
        { upTo: 30, tone: 'warning', word: 'Check' },
        { upTo: 100, tone: 'neutral', word: 'Normal' },
      ],
    },
  }),
  ledTank: led({
    id: 'glance-led-tank',
    size: '1x2',
    domain: 'home',
    name: 'Water tanks',
    props: {
      label: 'Water tanks',
      unit: '%',
      max: 100,
      count: 20,
      orientation: 'column',
      channels: [
        { id: 'roof', label: 'Roof', value: 62, note: '620 of 1,000 L' },
        { id: 'ground', label: 'Ground', value: 18, note: '540 of 3,000 L · pump starts at 15%' },
      ],
      bands: [
        { upTo: 20, tone: 'warning', word: 'Low' },
        { upTo: 100, tone: 'neutral', word: 'Normal' },
      ],
    },
  }),
  ledSilo: led({
    id: 'glance-led-silo',
    size: '1x3',
    domain: 'agri',
    surface: 'dark',
    name: 'Silo levels',
    props: {
      label: 'Silos · Gudang Lampung',
      unit: 't',
      max: 400,
      count: 32,
      orientation: 'column',
      ends: ['0', '400 t'],
      channels: [
        { id: 's1', label: 'S1', name: 'Silo 1', value: 296, note: 'Silo 1 · 74% · maize, dried to 14%' },
        { id: 's2', label: 'S2', name: 'Silo 2', value: 112, note: 'Silo 2 · 28% · maize' },
        { id: 's3', label: 'S3', name: 'Silo 3', value: 388, note: 'Silo 3 · 97% · soybean, stop intake' },
      ],
      bands: [
        { upTo: 360, tone: 'neutral', word: 'Normal' },
        { upTo: 400, tone: 'warning', word: 'Near full' },
      ],
    },
  }),

  /* Capacity ring */
  ringWarehouse: ring({
    id: 'glance-ring-warehouse',
    size: '2x2',
    domain: 'logistics',
    name: 'Pallet capacity',
    props: {
      label: 'Pallet slots',
      unit: 'slots',
      sites: [
        { id: 'ckr', label: 'Cikarang', max: 12000, parts: [{ label: 'Stored', value: 8420 }, { label: 'Booked', value: 1210 }] },
        { id: 'sby', label: 'Surabaya', max: 8000, parts: [{ label: 'Stored', value: 6930 }, { label: 'Booked', value: 540 }] },
        { id: 'mks', label: 'Makassar', max: 4500, parts: [{ label: 'Stored', value: 2140 }, { label: 'Booked', value: 380 }] },
      ],
    },
  }),
  ringBeds: ring({
    id: 'glance-ring-beds',
    size: '2x2',
    domain: 'health',
    surface: 'muted',
    name: 'Bed capacity',
    props: {
      label: 'Beds · RSU Harapan Sehat',
      unit: 'beds',
      sites: [
        { id: 'ward', label: 'Wards', max: 264, parts: [{ label: 'Occupied', value: 212 }, { label: 'Cleaning', value: 14 }] },
        { id: 'icu', label: 'ICU', max: 24, parts: [{ label: 'Occupied', value: 22 }, { label: 'Cleaning', value: 1 }] },
        { id: 'er', label: 'ER', max: 18, parts: [{ label: 'Occupied', value: 11 }, { label: 'Cleaning', value: 2 }] },
      ],
    },
  }),
  ringParking: ring({
    id: 'glance-ring-parking',
    size: '1x2',
    domain: 'transit',
    name: 'Parking capacity',
    props: {
      label: 'Park and ride · Bekasi',
      unit: 'bays',
      bars: 32,
      sites: [
        { id: 'p1', label: 'P1', max: 520, parts: [{ label: 'Taken', value: 418 }, { label: 'Held', value: 40 }] },
        { id: 'p2', label: 'P2', max: 310, parts: [{ label: 'Taken', value: 296 }, { label: 'Held', value: 6 }] },
      ],
    },
  }),
  ringNodes: ring({
    id: 'glance-ring-nodes',
    size: '2x2',
    domain: 'devops',
    surface: 'dark',
    name: 'Cluster capacity',
    props: {
      label: 'vCPU · node pools',
      unit: 'vCPU',
      sites: [
        { id: 'gen', label: 'general', max: 640, parts: [{ label: 'Requested', value: 412 }, { label: 'System', value: 36 }] },
        { id: 'mem', label: 'memory', max: 256, parts: [{ label: 'Requested', value: 231 }, { label: 'System', value: 12 }] },
        { id: 'gpu', label: 'gpu', max: 96, parts: [{ label: 'Requested', value: 40 }, { label: 'System', value: 4 }] },
      ],
    },
  }),

  /* Zone clock */
  clockTeam: clock({
    id: 'glance-clock-team',
    size: '1x1',
    domain: 'workspace',
    name: 'Team clock',
    props: {
      label: 'Team clock',
      pixel: true,
      places: [
        { city: 'Jakarta', tz: 'Asia/Jakarta', zone: 'WIB' },
        { city: 'Denpasar', tz: 'Asia/Makassar', zone: 'WITA' },
        { city: 'Jayapura', tz: 'Asia/Jayapura', zone: 'WIT' },
        { city: 'Singapore', tz: 'Asia/Singapore', zone: 'SGT' },
        { city: 'London', tz: 'Europe/London', zone: 'GMT' },
        { city: 'Zulu', tz: 'UTC', zone: 'UTC' },
      ],
    },
  }),
  clockZulu: clock({
    id: 'glance-clock-zulu',
    size: '1x1',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Zulu and local',
    props: {
      label: 'Flight ops',
      pixel: true,
      home: 'UTC',
      places: [
        { city: 'Zulu', tz: 'UTC', zone: 'UTC' },
        { city: 'Biak, local', tz: 'Asia/Jayapura', zone: 'WIT' },
        { city: 'Jakarta', tz: 'Asia/Jakarta', zone: 'WIB' },
      ],
    },
  }),
  clockFamily: clock({
    id: 'glance-clock-family',
    size: '1x1',
    domain: 'home',
    surface: 'muted',
    name: 'Family clock',
    props: {
      label: 'Family abroad',
      places: [
        { city: 'Rina · London', tz: 'Europe/London', zone: 'GMT' },
        { city: 'Dimas · Melbourne', tz: 'Australia/Melbourne', zone: 'AEDT' },
        { city: 'Ayu · Tokyo', tz: 'Asia/Tokyo', zone: 'JST' },
        { city: 'Bima · Jeddah', tz: 'Asia/Riyadh', zone: 'AST' },
      ],
    },
  }),

  /* Desks across zones */
  desksDepots: desks({
    id: 'glance-desks-depots',
    size: '4x1',
    domain: 'logistics',
    surface: 'dark',
    name: 'Depots across zones',
    props: {
      label: 'Depots',
      places: [
        { city: 'Jakarta · Cakung', tz: 'Asia/Jakarta', zone: 'WIB', always: true },
        { city: 'Makassar', tz: 'Asia/Makassar', zone: 'WITA', open: 6, close: 22 },
        { city: 'Jayapura', tz: 'Asia/Jayapura', zone: 'WIT', open: 7, close: 19 },
        { city: 'Singapore', tz: 'Asia/Singapore', zone: 'SGT', open: 8, close: 20 },
      ],
    },
  }),
  desksTreasury: desks({
    id: 'glance-desks-treasury',
    size: '2x2',
    domain: 'banking',
    name: 'Treasury desks',
    props: {
      label: 'Treasury desks',
      weekdaysOnly: true,
      places: [
        { city: 'Jakarta', tz: 'Asia/Jakarta', zone: 'WIB', open: 8, close: 17 },
        { city: 'Singapore', tz: 'Asia/Singapore', zone: 'SGT', open: 8, close: 18 },
        { city: 'London', tz: 'Europe/London', zone: 'GMT', open: 8, close: 17 },
        { city: 'New York', tz: 'America/New_York', zone: 'EST', open: 8, close: 17 },
      ],
    },
  }),
  desksBureaus: desks({
    id: 'glance-desks-bureaus',
    size: '1x2',
    domain: 'media',
    name: 'Bureaus across zones',
    props: {
      label: 'Bureaus',
      places: [
        { city: 'Jakarta', tz: 'Asia/Jakarta', zone: 'WIB', open: 6, close: 23 },
        { city: 'Makassar', tz: 'Asia/Makassar', zone: 'WITA', open: 7, close: 21 },
        { city: 'Jayapura', tz: 'Asia/Jayapura', zone: 'WIT', open: 8, close: 18 },
        { city: 'Singapore', tz: 'Asia/Singapore', zone: 'SGT', open: 8, close: 20 },
      ],
    },
  }),

  /* Balance, hidden on demand */
  balanceSavings: balance({
    id: 'glance-balance-savings',
    size: '2x1',
    domain: 'banking',
    surface: 'brand',
    props: {
      account: 'Tabungan · Arunika Bank',
      number: '···· 2207',
      amount: 18240500,
      asOf: 'As of 14:02 WIB',
    },
  }),
  balanceWallet: balance({
    id: 'glance-balance-wallet',
    size: '1x1',
    domain: 'payments',
    name: 'Hold to peek',
    hint: 'Press and hold the button, or hold Space, to see the balance',
    props: {
      account: 'Dompet Simpul',
      amount: 842300,
      caption: 'Balance',
      mode: 'peek',
    },
  }),
  balanceTreasury: balance({
    id: 'glance-balance-treasury',
    size: '2x1',
    domain: 'banking',
    surface: 'muted',
    name: 'Operating balance',
    props: {
      account: 'Operating · Bank Sagara',
      number: '···· 0418',
      amount: 48.2e9,
      format: 'idr',
      hidden: true,
      asOf: 'As of 14:02 WIB · sweep at 16:00',
    },
  }),
  balanceTill: balance({
    id: 'glance-balance-till',
    size: '1x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'Till takings',
    props: {
      account: 'Kasir 1 · Bu Ratna',
      amount: 3418500,
      caption: 'Today’s takings',
      hidden: true,
    },
  }),

  /* Ninety days */
  uptimeApi: uptime({
    id: 'glance-uptime-api',
    size: '4x1',
    domain: 'devops',
    props: {
      label: 'api-gateway',
      values: daily('glance-uptime-api', 90, { base: 100, jitter: 0.04, set: { 23: 98.4, 61: 99.62, 62: 99.86, 84: 99.71 } }),
      warn: 99.9,
      bad: 99,
      notes: {
        23: 'TLS certificate expired at the edge for 23 min',
        61: 'Elevated 5xx in ap-southeast-3',
        62: 'Elevated 5xx, recovering',
        84: 'Slow DNS at edge-cache for 18 min',
      },
    },
  }),
  uptimeOntime: uptime({
    id: 'glance-uptime-ontime',
    size: '3x1',
    domain: 'transit',
    surface: 'muted',
    name: 'Ninety days on time',
    props: {
      label: 'Bogor line',
      metric: 'On time',
      decimals: 1,
      warn: 95,
      bad: 85,
      words: ['On time', 'Late', 'Disrupted'],
      values: daily('glance-uptime-ontime', 90, {
        base: 99,
        jitter: 3.5,
        decimals: 1,
        set: { 12: 88.2, 13: 91.4, 40: 76.5, 41: 89.9, 66: 92.8, 77: 93.1 },
      }),
      notes: {
        12: 'Signal works near Depok',
        13: 'Signal works near Depok, second day',
        40: 'Flooding at Manggarai, 3 h without service',
        41: 'Timetable recovering after the flood',
        66: 'Train fault at Citayam',
        77: 'Holiday crowds, longer dwell times',
      },
    },
  }),
  uptimeLogs: uptime({
    id: 'glance-uptime-logs',
    size: '3x1',
    domain: 'security',
    surface: 'dark',
    name: 'Ninety days of coverage',
    props: {
      label: 'SIEM ingestion',
      metric: 'Coverage',
      decimals: 1,
      warn: 99,
      bad: 90,
      words: ['Complete', 'Gaps', 'Blind'],
      values: daily('glance-uptime-logs', 90, { base: 100, jitter: 0.6, start: 6, decimals: 1, set: { 31: 82, 32: 97.1, 57: 98.2, 70: 64.5 } }),
      notes: {
        31: 'Firewall logs missing for 4 h after a collector upgrade',
        32: 'Backfill finished 11:20 WIB',
        57: 'Endpoint agent update, 26 min of gaps',
        70: 'Ingest queue stalled, 8 h of endpoint logs late',
      },
    },
  }),
  uptimeRail: uptime({
    id: 'glance-uptime-rail',
    size: '2x1',
    domain: 'payments',
    name: 'Ninety days of transfers',
    props: {
      label: 'Instant transfers',
      metric: 'Success',
      warn: 99.5,
      bad: 98,
      words: ['Healthy', 'Degraded', 'Failing'],
      values: daily('glance-uptime-rail', 90, { base: 99.97, jitter: 0.3, set: { 45: 97.9, 72: 99.1 } }),
      notes: {
        45: 'Switch timeouts at the network for 2 h',
        72: 'Bank-side maintenance, 40 min',
      },
    },
  }),

  /* Health matrix */
  matrixSensors: matrix({
    id: 'glance-matrix-sensors',
    size: '2x2',
    domain: 'security',
    surface: 'dark',
    name: 'Sensor matrix',
    props: {
      label: 'IDS sensors',
      cols: 6,
      words: { good: 'OK', warning: 'Warn', critical: 'Down' },
      cells: bank('SEN-', 24, 'Heartbeat 4 s ago · no drops', {
        7: ['warning', 'CPU 92%, dropping 0.4% of packets'],
        15: ['critical', 'No heartbeat since 13:52 WIB'],
        19: ['warning', 'Rules two days old, update failed'],
      }),
    },
  }),
  matrixCctv: matrix({
    id: 'glance-matrix-cctv',
    size: '2x2',
    domain: 'civic',
    name: 'Camera matrix',
    props: {
      label: 'CCTV · Jalan Sudirman',
      cols: 6,
      words: { good: 'Live', warning: 'Check', critical: 'Down', off: 'Off' },
      cells: bank('C-', 24, 'Recording · 1080p', {
        9: ['warning', 'Lens blocked, reported 13:20 WIB'],
        14: ['critical', 'No picture since 12:47 WIB · Dukuh Atas'],
        22: ['off', 'Off for road works until 18 Nov'],
      }),
    },
  }),
  matrixPumps: matrix({
    id: 'glance-matrix-pumps',
    size: '2x2',
    domain: 'health',
    surface: 'muted',
    name: 'Pump matrix',
    props: {
      label: 'Infusion pumps · Ward 3',
      cols: 6,
      words: { good: 'Running', warning: 'Attention', critical: 'Stopped', off: 'Idle' },
      cells: bank('P-', 24, 'Running at the prescribed rate', {
        3: ['critical', 'Occlusion · Bed 3 · 13:58 WIB'],
        8: ['warning', 'Battery 12% · Bed 8'],
        11: ['off', 'Idle, cleaned 12:30 WIB'],
        17: ['off', 'Idle'],
        21: ['warning', 'Bag empty in 9 min · Bed 21'],
      }),
    },
  }),
  matrixReefers: matrix({
    id: 'glance-matrix-reefers',
    size: '3x2',
    domain: 'logistics',
    name: 'Reefer matrix',
    props: {
      label: 'Reefer plugs · Tanjung Priok, yard B',
      cols: 8,
      words: { good: 'In range', warning: 'Drifting', critical: 'No power', off: 'Empty' },
      cells: bank('R', 24, 'Supply on, holding its set point', {
        4: ['warning', 'Drifting · −15.9 °C against −18.0'],
        11: ['critical', 'Unplugged at 13:40 WIB · SKRU 418230-7'],
        16: ['off', 'Empty plug'],
        17: ['off', 'Empty plug'],
        23: ['warning', 'Door sensor open for 6 min'],
      }),
    },
  }),
  matrixMics: matrix({
    id: 'glance-matrix-mics',
    size: '2x1',
    domain: 'audio',
    name: 'Channel matrix',
    props: {
      label: 'Wireless mics · Stage A',
      cols: 12,
      ids: false,
      words: { good: 'OK', warning: 'Low battery', critical: 'Dropouts', off: 'Muted' },
      cells: bank('Ch ', 24, 'RF clean · battery above 50%', {
        5: ['warning', 'Battery 18% · lead vocal'],
        12: ['critical', 'RF dropouts · choir left'],
        18: ['off', 'Muted at the desk'],
        24: ['off', 'Spare, muted'],
      }),
    },
  }),

  /* KPI row */
  kpiShop: kpis({
    id: 'glance-kpi-shop',
    size: '4x2',
    domain: 'commerce',
    props: {
      label: 'Shop · Racik storefront',
      period: 'Today, by hour',
      sparkHeight: 96,
      items: [
        {
          label: 'Sales',
          value: 'IDR 412.6 M',
          delta: 6.4,
          series: [12, 30, 58, 92, 131, 170, 204, 236, 268, 305, 342, 380, 398, 412.6],
          note: 'Target IDR 480 M by 22:00 WIB · on pace',
        },
        {
          label: 'Orders',
          value: '1,284',
          delta: 3.1,
          series: [38, 96, 181, 288, 410, 532, 641, 735, 830, 941, 1052, 1170, 1236, 1284],
          note: 'Same hour last week: 1,245',
        },
        {
          label: 'Basket',
          value: 'Rp 321.400',
          delta: 2.2,
          series: walk('glance-kpi-basket', 14, 309000, 0.02, { drift: 0.05, decimals: 0 }),
          note: 'Average order, after discounts',
        },
        {
          label: 'Conversion',
          value: '3.4',
          unit: '%',
          delta: 0.4,
          suffix: ' pp',
          series: walk('glance-kpi-conv', 14, 3.0, 0.05, { drift: 0.08, decimals: 2 }),
          note: 'Target 3.0% · ahead by 0.4 pp',
        },
      ],
    },
  }),
  kpiPayments: kpis({
    id: 'glance-kpi-payments',
    size: '3x2',
    domain: 'payments',
    surface: 'dark',
    name: 'Payment KPIs',
    props: {
      label: 'Payments · all rails',
      period: 'Last 24 h',
      sparkHeight: 96,
      items: [
        {
          label: 'TPV',
          value: 'IDR 18.4 bn',
          delta: 4.8,
          series: wave('glance-kpi-tpv', 24, { base: 760, amp: 420, period: 24, phase: -6, noise: 0.08 }),
          note: 'Total payment value, by hour',
        },
        {
          label: 'Success',
          value: '98.62',
          unit: '%',
          delta: -0.21,
          suffix: ' pp',
          series: walk('glance-kpi-success', 24, 98.9, 0.002, { max: 99.6, drift: -0.05, decimals: 2 }),
          note: 'Target 98.5% · 3 issuers below 95%',
        },
        {
          label: 'p95',
          value: '412',
          unit: 'ms',
          delta: -6.3,
          invert: true,
          series: walk('glance-kpi-p95', 24, 448, 0.04, { drift: -0.06, decimals: 0 }),
          note: 'Authorisation round trip',
        },
      ],
    },
  }),
  kpiStream: kpis({
    id: 'glance-kpi-stream',
    size: '4x1',
    domain: 'media',
    name: 'Broadcast KPIs',
    props: {
      label: 'Evening bulletin · 19:00 WIB',
      detail: 'side',
      sparkHeight: 36,
      items: [
        { label: 'Viewers', value: '1.24', unit: 'M', delta: 8.2, series: [0.31, 0.62, 0.88, 1.02, 1.11, 1.18, 1.21, 1.24], note: 'Peak 1.31 M at 19:12 WIB' },
        { label: 'Watch time', value: '18.7', unit: 'min', delta: 2.9, series: [6, 9, 12, 14, 16, 17, 18.2, 18.7], note: 'Average per viewer' },
        { label: 'Completion', value: '61', unit: '%', delta: -3, suffix: ' pp', series: [72, 70, 67, 66, 64, 63, 62, 61], note: 'Target 65%' },
        { label: 'Shares', value: '9,420', delta: 14.1, series: [400, 1300, 2600, 4100, 5600, 7200, 8500, 9420], note: 'Mostly the flood segment' },
      ],
    },
  }),
  kpiWard: kpis({
    id: 'glance-kpi-ward',
    size: '2x2',
    domain: 'health',
    name: 'Ward KPIs',
    props: {
      label: 'Ward 3 · this shift',
      period: 'Since 07:00',
      cols: 2,
      sparkHeight: 40,
      items: [
        { label: 'Admissions', value: '9', delta: 12.5, series: [0, 1, 2, 2, 4, 5, 7, 9], note: '6 from the ER, 3 planned' },
        { label: 'Discharges', value: '7', delta: -12.5, series: [0, 0, 1, 3, 4, 5, 6, 7], note: '3 more waiting for pharmacy' },
        { label: 'Bed wait', value: '42', unit: 'min', delta: -18, invert: true, series: [64, 58, 61, 52, 49, 47, 44, 42], note: 'Median, from ER decision to bed' },
        { label: 'Falls', value: '0', delta: 0, series: [0, 0, 0, 0, 0, 0, 0, 0], note: '41 days without a fall' },
      ],
    },
  }),

  /* Charge and range */
  rangeVan: range({
    id: 'glance-range-van',
    size: '2x1',
    domain: 'logistics',
    props: {
      label: 'EV van',
      id: 'B 9128 UXT',
      charge: 64,
      word: 'Parked',
      state: 'Depot Cakung · next run 15:30 WIB',
      modes: [
        { id: 'eco', label: 'Eco', range: 182, unit: 'km' },
        { id: 'normal', label: 'Normal', range: 156, unit: 'km' },
        { id: 'loaded', label: 'Full load', range: 131, unit: 'km' },
      ],
    },
  }),
  rangeScooter: range({
    id: 'glance-range-scooter',
    size: '1x1',
    domain: 'transit',
    name: 'Scooter charge',
    props: {
      label: 'E-scooter',
      id: '0412',
      charge: 17,
      state: 'Kemang · 120 m away',
      modes: [
        { id: 'km', label: 'km', range: 9, unit: 'km' },
        { id: 'min', label: 'min', range: 31, unit: 'min' },
      ],
    },
  }),
  rangeDrone: range({
    id: 'glance-range-drone',
    size: '1x2',
    domain: 'agri',
    name: 'Drone charge',
    props: {
      label: 'Spray drone',
      id: 'DR-03',
      charge: 46,
      word: 'Flying',
      rangeLabel: 'Covers',
      state: 'Blok C, row 14 · tank 6 of 10 L',
      modes: [
        { id: 'spray', label: 'Spraying', range: 2.4, unit: 'ha', decimals: 1 },
        { id: 'flight', label: 'Flight', range: 9, unit: 'min' },
      ],
    },
  }),
  rangeHome: range({
    id: 'glance-range-home',
    size: '2x2',
    domain: 'home',
    surface: 'muted',
    name: 'Home battery',
    props: {
      label: 'Home battery',
      id: '13.5 kWh',
      charge: 81,
      charging: true,
      large: true,
      rangeLabel: 'Lasts',
      state: 'Charging from the roof at 2.4 kW · full at 15:40 WIB',
      modes: [
        { id: 'now', label: 'Now', range: 9.3, unit: 'h', decimals: 1 },
        { id: 'night', label: 'Night', range: 14, unit: 'h' },
        { id: 'outage', label: 'Outage', range: 26, unit: 'h' },
      ],
    },
  }),

  /* Weather by the hour */
  weatherSpray: weather({
    id: 'glance-weather-spray',
    size: '2x2',
    domain: 'agri',
    name: 'Spray window',
    props: {
      place: 'Kebun Lereng · Temanggung',
      issued: 'Issued 14:00 WIB',
      rule: 'Spray window',
      hours: [
        { t: '14:00', temp: 27, rain: 20, mm: 0, wind: 9, deg: 120, sky: 'partly', ok: true },
        { t: '15:00', temp: 26, rain: 35, mm: 0.2, wind: 11, deg: 130, sky: 'cloud', ok: false },
        { t: '16:00', temp: 24, rain: 70, mm: 3.1, wind: 16, deg: 140, sky: 'storm', ok: false },
        { t: '17:00', temp: 23, rain: 80, mm: 5.4, wind: 18, deg: 150, sky: 'storm', ok: false },
        { t: '18:00', temp: 22, rain: 60, mm: 1.8, wind: 12, deg: 150, sky: 'rain', ok: false },
        { t: '19:00', temp: 21, rain: 30, mm: 0.4, wind: 8, deg: 140, sky: 'cloud', ok: false },
        { t: '20:00', temp: 21, rain: 15, mm: 0, wind: 6, deg: 120, sky: 'cloud', ok: true },
        { t: '21:00', temp: 20, rain: 10, mm: 0, wind: 5, deg: 110, sky: 'partly', ok: true },
        { t: '22:00', temp: 20, rain: 10, mm: 0, wind: 4, deg: 100, sky: 'clear', ok: true },
        { t: '23:00', temp: 19, rain: 5, mm: 0, wind: 4, deg: 90, sky: 'clear', ok: true },
        { t: '00:00', temp: 19, rain: 5, mm: 0, wind: 3, deg: 90, sky: 'clear', ok: true },
        { t: '01:00', temp: 18, rain: 10, mm: 0, wind: 3, deg: 80, sky: 'clear', ok: true },
      ],
    },
  }),
  weatherCity: weather({
    id: 'glance-weather-city',
    size: '3x2',
    domain: 'civic',
    surface: 'dark',
    name: 'Rain and drains',
    props: {
      place: 'Jakarta Pusat · flood watch',
      issued: 'Issued 14:00 WIB',
      rule: 'Drains cope',
      ruleWords: ['Yes', 'No'],
      hours: [
        { t: '14:00', temp: 33, rain: 40, mm: 0.5, wind: 10, deg: 300, sky: 'partly', ok: true },
        { t: '15:00', temp: 32, rain: 65, mm: 4.2, wind: 14, deg: 290, sky: 'rain', ok: true },
        { t: '16:00', temp: 29, rain: 90, mm: 28.5, wind: 22, deg: 280, sky: 'storm', ok: false },
        { t: '17:00', temp: 27, rain: 85, mm: 19, wind: 18, deg: 280, sky: 'storm', ok: false },
        { t: '18:00', temp: 27, rain: 70, mm: 8.4, wind: 12, deg: 270, sky: 'rain', ok: true },
        { t: '19:00', temp: 26, rain: 45, mm: 1.2, wind: 9, deg: 260, sky: 'rain', ok: true },
        { t: '20:00', temp: 26, rain: 30, mm: 0.3, wind: 7, deg: 250, sky: 'cloud', ok: true },
        { t: '21:00', temp: 26, rain: 20, mm: 0, wind: 6, deg: 240, sky: 'cloud', ok: true },
        { t: '22:00', temp: 25, rain: 15, mm: 0, wind: 5, deg: 230, sky: 'partly', ok: true },
        { t: '23:00', temp: 25, rain: 10, mm: 0, wind: 5, deg: 220, sky: 'clear', ok: true },
        { t: '00:00', temp: 25, rain: 10, mm: 0, wind: 4, deg: 210, sky: 'clear', ok: true },
        { t: '01:00', temp: 24, rain: 15, mm: 0, wind: 4, deg: 200, sky: 'cloud', ok: true },
      ],
    },
  }),
  weatherHome: weather({
    id: 'glance-weather-home',
    size: '2x1',
    domain: 'home',
    name: 'Weather at home',
    props: {
      place: 'Home · Bandung',
      issued: '14:00 WIB',
      compact: true,
      hours: [
        { t: '14:00', temp: 26, rain: 30, mm: 0, wind: 8, deg: 340, sky: 'partly' },
        { t: '15:00', temp: 25, rain: 55, mm: 1, wind: 9, deg: 330, sky: 'rain' },
        { t: '16:00', temp: 23, rain: 75, mm: 4.6, wind: 12, deg: 320, sky: 'rain' },
        { t: '17:00', temp: 22, rain: 60, mm: 2.2, wind: 10, deg: 320, sky: 'rain' },
        { t: '18:00', temp: 21, rain: 40, mm: 0.6, wind: 7, deg: 310, sky: 'cloud' },
        { t: '19:00', temp: 21, rain: 25, mm: 0, wind: 6, deg: 300, sky: 'cloud' },
        { t: '20:00', temp: 20, rain: 15, mm: 0, wind: 5, deg: 290, sky: 'partly' },
        { t: '21:00', temp: 20, rain: 10, mm: 0, wind: 4, deg: 280, sky: 'clear' },
        { t: '22:00', temp: 19, rain: 10, mm: 0, wind: 4, deg: 270, sky: 'clear' },
        { t: '23:00', temp: 19, rain: 10, mm: 0, wind: 3, deg: 270, sky: 'clear' },
        { t: '00:00', temp: 18, rain: 5, mm: 0, wind: 3, deg: 260, sky: 'clear' },
        { t: '01:00', temp: 18, rain: 5, mm: 0, wind: 3, deg: 250, sky: 'clear' },
      ],
    },
  }),

  /* Air quality */
  airCity: air({
    id: 'glance-air-city',
    size: '2x1',
    domain: 'civic',
    props: {
      place: 'Air · Kebayoran Baru',
      readings: [
        { id: 'pm25', label: 'PM2.5', value: 48, unit: 'µg/m³', bands: PM25 },
        { id: 'pm10', label: 'PM10', value: 71, unit: 'µg/m³', bands: PM10 },
        { id: 'o3', label: 'O₃', value: 96, unit: 'µg/m³', bands: O3 },
      ],
    },
  }),
  airRooms: air({
    id: 'glance-air-rooms',
    size: '1x1',
    domain: 'workspace',
    name: 'Room air',
    hint: 'Press the tile, or use the arrow keys, to step through the rooms',
    props: {
      place: 'Meeting rooms · CO₂',
      cycle: true,
      readings: [
        { id: 'merapi', label: 'Merapi', value: 1240, unit: 'ppm', bands: CO2 },
        { id: 'rinjani', label: 'Rinjani', value: 620, unit: 'ppm', bands: CO2 },
        { id: 'semeru', label: 'Semeru', value: 910, unit: 'ppm', bands: CO2 },
        { id: 'kerinci', label: 'Kerinci', value: 1580, unit: 'ppm', bands: CO2 },
      ],
    },
  }),
  airBedroom: air({
    id: 'glance-air-bedroom',
    size: '1x2',
    domain: 'home',
    surface: 'muted',
    name: 'Bedroom air',
    props: {
      place: 'Bedroom',
      orientation: 'column',
      readings: [
        { id: 'pm25', label: 'PM2.5', value: 9, unit: 'µg/m³', bands: PM25, advice: 'Purifier on low. Outside it is 48.' },
        { id: 'co2', label: 'CO₂', value: 720, unit: 'ppm', bands: CO2, advice: 'Fresh enough to sleep with the window shut.' },
      ],
    },
  }),
  airFence: air({
    id: 'glance-air-fence',
    size: '2x1',
    domain: 'energy',
    surface: 'dark',
    name: 'Fence-line air',
    props: {
      place: 'Fence line · smelter, Morowali',
      readings: [
        { id: 'so2', label: 'SO₂', value: 182, unit: 'µg/m³', bands: SO2 },
        { id: 'pm10', label: 'PM10', value: 96, unit: 'µg/m³', bands: PM10 },
        { id: 'no2', label: 'NO₂', value: 64, unit: 'µg/m³', bands: NO2 },
      ],
    },
  }),

  /* Signal strength */
  signalLora: signal({
    id: 'glance-signal-lora',
    size: '1x1',
    domain: 'agri',
    props: {
      label: 'LoRa gateway · Blok C',
      levels: [-90, -105, -115, -125],
      spread: 5,
      links: [{ id: 'as923', label: 'AS923', value: -112 }],
    },
  }),
  signalSatcom: signal({
    id: 'glance-signal-satcom',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    name: 'Satcom link',
    props: {
      label: 'Satcom · patrol boat P-841',
      unit: 'dB',
      decimals: 1,
      spread: 0.8,
      levels: [10, 7, 4, 2],
      links: [{ id: 'ku', label: 'Ku band', value: 8.4 }],
    },
  }),
  signalUav: signal({
    id: 'glance-signal-uav',
    size: '2x2',
    domain: 'defense',
    surface: 'dark',
    name: 'Command link',
    props: {
      label: 'C2 link · UAV-07',
      levels: [-80, -90, -100, -110],
      links: [
        {
          id: 'pri',
          label: 'Primary',
          value: -86,
          stats: [
            { label: 'Latency', value: '42 ms' },
            { label: 'Packet loss', value: '0.3%' },
            { label: 'Distance', value: '38 km' },
          ],
        },
        {
          id: 'bak',
          label: 'Backup',
          value: -103,
          stats: [
            { label: 'Latency', value: '610 ms' },
            { label: 'Packet loss', value: '2.1%' },
            { label: 'Distance', value: '38 km' },
          ],
        },
      ],
    },
  }),
  signalEdc: signal({
    id: 'glance-signal-edc',
    size: '1x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'Terminal signal',
    props: {
      label: 'Card terminal · Kasir 2',
      levels: [-85, -95, -105, -115],
      links: [{ id: '4g', label: '4G', value: -93 }],
    },
  }),

  /* Heading */
  headingVessel: heading({
    id: 'glance-heading-vessel',
    size: '1x2',
    domain: 'logistics',
    surface: 'dark',
    props: {
      label: 'KM Sagara Jaya',
      mode: 'card',
      dial: 140,
      stack: true,
      speed: { label: 'Speed over ground', value: 12.4 },
      views: [
        { id: 'true', label: 'True', deg: 247 },
        { id: 'mag', label: 'Magnetic', deg: 246 },
      ],
    },
  }),
  headingRunway: heading({
    id: 'glance-heading-runway',
    size: '2x2',
    domain: 'aerospace',
    name: 'Runway wind',
    hint: 'Switch the runway in use; headwind and crosswind follow',
    props: {
      label: 'Runway wind · DPS',
      mode: 'runway',
      dial: 168,
      wind: { from: 110, speed: 14, gust: 22 },
      views: [
        { id: '09', label: '09', deg: 93 },
        { id: '27', label: '27', deg: 273 },
      ],
    },
  }),
  headingWind: heading({
    id: 'glance-heading-wind',
    size: '1x1',
    domain: 'agri',
    name: 'Wind direction',
    props: {
      label: 'Wind · Blok C',
      mode: 'wind',
      unit: 'km/h',
      dial: 64,
      views: [
        { id: 'now', label: 'Now', deg: 120, speed: 9 },
        { id: '3h', label: '+3 h', deg: 140, speed: 16 },
        { id: '6h', label: '+6 h', deg: 150, speed: 12 },
      ],
    },
  }),
  headingPatrol: heading({
    id: 'glance-heading-patrol',
    size: '1x1',
    domain: 'defense',
    surface: 'dark',
    props: {
      label: 'Patrol boat P-841',
      mode: 'card',
      dial: 64,
      views: [
        { id: 'true', label: 'True', deg: 32 },
        { id: 'mag', label: 'Mag', deg: 31 },
      ],
    },
  }),

  /* Next up */
  nextMeeting: next({
    id: 'glance-next-meeting',
    size: '2x1',
    domain: 'workspace',
    props: {
      kind: 'Next meeting',
      action: 'Join',
      done: 'Joined',
      items: [
        { title: 'Treasury stand-up', when: '14:15–14:30 WIB', inMin: 12, where: 'Room Merapi, 4F', detail: 'Ayu Lestari, Grace Liu and 4 more' },
        { title: 'Payroll release review', when: '15:00–15:30 WIB', inMin: 57, where: 'Sesi call', detail: 'Dewi Anggraini, Sari Wulandari' },
        { title: 'Vendor call · Kopra Labs', when: '16:00–16:45 WIB', inMin: 117, where: 'Room Rinjani, 4F', detail: 'Arjun Mehta and 2 more' },
        { title: 'Risk committee', when: '17:00–18:00 WIB', inMin: 177, where: 'Board room, 9F', detail: 'Maya Kartika and 7 more' },
      ],
    },
  }),
  nextTrain: next({
    id: 'glance-next-train',
    size: '1x1',
    domain: 'transit',
    surface: 'dark',
    name: 'Next train',
    hint: 'Page through the departures with the arrows',
    props: {
      kind: 'From Manggarai',
      minutes: true,
      pixel: true,
      items: [
        { title: 'Bogor', when: 'Platform 6 · 14:06 WIB', inMin: 4 },
        { title: 'Bogor', when: 'Platform 6 · 14:13 WIB', inMin: 11 },
        { title: 'Depok', when: 'Platform 7 · 14:21 WIB', inMin: 19 },
      ],
    },
  }),
  nextDose: next({
    id: 'glance-next-dose',
    size: '2x1',
    domain: 'health',
    name: 'Next dose',
    props: {
      kind: 'Next dose',
      action: 'Mark given',
      done: 'Given',
      items: [
        { title: 'Ceftriaxone 1 g IV', when: '16:00 WIB', inMin: 38, where: 'Bed 12', detail: 'Pak Hendra, 64 · no known allergies' },
        { title: 'Paracetamol 1 g oral', when: '16:00 WIB', inMin: 38, where: 'Bed 7', detail: 'Bu Lestari, 51 · 38.2 °C at 13:40 WIB' },
        { title: 'Insulin glargine 18 units', when: '21:00 WIB', inMin: 338, where: 'Bed 3', detail: 'Pak Wahyu, 70 · check glucose first' },
      ],
    },
  }),
  nextPickup: next({
    id: 'glance-next-pickup',
    size: '2x1',
    domain: 'logistics',
    surface: 'muted',
    name: 'Next pickup',
    props: {
      kind: 'Next pickup',
      action: 'Start route',
      done: 'En route',
      items: [
        { title: 'PT Kopi Lereng · Temanggung', when: '15:30 WIB', inMin: 25, where: 'Dock 4', detail: '18 pallets · 6.2 t · ambient' },
        { title: 'CV Rotan Cirebon', when: '17:00 WIB', inMin: 115, where: 'Gate B', detail: '42 cartons · 1.1 t' },
        { title: 'PT Merapi Semen', when: '18:30 WIB', inMin: 205, where: 'Silo yard', detail: '24 t bulk · needs the tipper' },
      ],
    },
  }),
  nextPayout: next({
    id: 'glance-next-payout',
    size: '1x1',
    domain: 'payments',
    surface: 'brand',
    name: 'Next payout',
    hint: 'Page through the coming payouts with the arrows',
    props: {
      kind: 'Next payout',
      items: [
        { title: '13 Nov · 16:00 WIB', when: 'Friday · to Arunika ···· 2207', inMin: 11520, figure: 'Rp 37.415.000' },
        { title: '16 Nov · 16:00 WIB', when: 'Monday · to Arunika ···· 2207', inMin: 15840, figure: 'Rp 12.880.000' },
        { title: '17 Nov · 16:00 WIB', when: 'Tuesday · to Arunika ···· 2207', inMin: 17280, figure: 'Rp 9.214.500' },
      ],
    },
  }),

  /* Who's in */
  presenceFloor: presence({
    id: 'glance-presence-floor',
    size: '2x2',
    domain: 'workspace',
    props: {
      label: 'Floor 4 · today',
      cols: 6,
      people: [
        { name: 'Rina Hartono', role: 'Product designer', where: 'office', note: 'Desk 4F-12 · in since 08:42 WIB' },
        { name: 'Kevin Tan', role: 'Backend engineer', where: 'office', busy: true, note: 'Room Merapi until 14:30 WIB' },
        { name: 'Arjun Mehta', role: 'Solutions architect', where: 'remote', note: 'Bandung · online since 09:10 WIB' },
        { name: 'Putri Maharani', role: 'Customer success', where: 'office', note: 'Desk 4F-03 · in since 08:05 WIB' },
        { name: 'Andika Saputra', role: 'Data engineer', where: 'remote', busy: true, note: 'Yogyakarta · on a call' },
        { name: 'Laras Wulandari', role: 'Editor', where: 'away', note: 'On leave until 12 Nov' },
        { name: 'Sofia Marques', role: 'Partner manager', where: 'office', note: 'Desk 4F-20 · in since 10:30 WIB' },
        { name: 'Rizky Pratama', role: 'Site reliability engineer', where: 'office', note: 'Desk 4F-08 · on call this week' },
        { name: 'Maya Kartika', role: 'Compliance officer', where: 'away', note: 'Training in Singapore until 6 Nov' },
        { name: 'Daniel Okafor', role: 'Network engineer', where: 'remote', note: 'Surabaya · online since 08:00 WIB' },
        { name: 'Grace Liu', role: 'FX trader', where: 'office', busy: true, note: 'Trading floor, 9F' },
        { name: 'Fajar Nugroho', role: 'Security analyst', where: 'office', note: 'Desk 4F-15 · in since 07:58 WIB' },
      ],
    },
  }),
  presenceNewsroom: presence({
    id: 'glance-presence-newsroom',
    size: '2x1',
    domain: 'media',
    name: 'Newsroom',
    props: {
      label: 'Bulletin team',
      cols: 7,
      filter: false,
      lamps: false,
      words: ['Desk', 'Field', 'Off'],
      people: [
        { name: 'Laras Wulandari', role: 'Editor', where: 'office', busy: true, note: 'Running order, 14 items' },
        { name: 'Siti Rahayu', role: 'Reporter', where: 'remote', note: 'Bekasi · flood story' },
        { name: 'Yohanes Lado', role: 'Camera', where: 'remote', busy: true, note: 'Live shot at 15:00 WIB' },
        { name: 'Nur Aini', role: 'Producer', where: 'office', busy: true, note: 'In the gallery' },
        { name: 'Gede Arsana', role: 'Reporter', where: 'remote', note: 'Denpasar bureau' },
        { name: 'Monica Tan', role: 'Copy editor', where: 'office', note: '6 stories in her queue' },
        { name: 'Ratna Dewi', role: 'Presenter', where: 'away', note: 'On air from 19:00 WIB' },
      ],
    },
  }),
  presenceShift: presence({
    id: 'glance-presence-shift',
    size: '1x2',
    domain: 'health',
    name: 'Night shift',
    props: {
      label: 'Ward 3 · night',
      layout: 'list',
      words: ['On ward', 'On call', 'Off'],
      people: [
        { name: 'Nadia Rahman', role: 'Clinical nurse', where: 'office', note: 'Beds 1–6 · since 19:00 WIB' },
        { name: 'Dina Marlina', role: 'Nurse', where: 'office', busy: true, note: 'With Bed 3 · since 21:10 WIB' },
        { name: 'Kevin Wijaya', role: 'Resident', where: 'remote', note: 'On call · 6 min away' },
        { name: 'Clara Siahaan', role: 'Pharmacist', where: 'remote', note: 'On call · pharmacy, ground floor' },
        { name: 'Yosef Nainggolan', role: 'Nurse', where: 'away', note: 'Back at 07:00 WIB' },
      ],
    },
  }),

  /* Progress to a goal */
  goalFund: goal({
    id: 'glance-goal-fund',
    size: '2x1',
    domain: 'banking',
    props: {
      label: 'Emergency fund',
      done: 32400000,
      target: 50000000,
      format: 'rp',
      pace: 30000000,
      due: 'by 31 Mar 2027',
      words: ['Saved', 'To go'],
    },
  }),
  goalHarvest: goal({
    id: 'glance-goal-harvest',
    size: '2x2',
    domain: 'agri',
    name: 'Harvest to target',
    props: {
      label: 'Coffee cherry harvest',
      done: 412,
      target: 600,
      unit: 't',
      pace: 455,
      due: 'season ends 15 Dec',
      note: '38 pickers today',
      words: ['Picked', 'To go'],
      parts: [
        { label: 'Blok A', done: 128, target: 160 },
        { label: 'Blok B', done: 96, target: 150 },
        { label: 'Blok C', done: 110, target: 140 },
        { label: 'Blok D', done: 78, target: 150 },
      ],
    },
  }),
  goalDonation: goal({
    id: 'glance-goal-donation',
    size: '1x2',
    domain: 'civic',
    name: 'Fundraising',
    props: {
      label: 'Bridge for Desa Sukamaju',
      done: 412000000,
      target: 600000000,
      format: 'idr',
      pace: 380000000,
      due: 'closes 30 Nov',
      note: '1,284 donors',
      words: ['Raised', 'To go'],
    },
  }),
  goalBudget: goal({
    id: 'glance-goal-budget',
    size: '2x1',
    domain: 'devops',
    surface: 'muted',
    name: 'Error budget',
    props: {
      label: 'Error budget · checkout · 30 days',
      done: 26.9,
      target: 43.2,
      unit: 'min',
      decimals: 1,
      pace: 18.7,
      invert: true,
      startLeft: true,
      words: ['Burned', 'Left'],
      note: 'burning at 1.4×',
    },
  }),
  goalLeave: goal({
    id: 'glance-goal-leave',
    size: '1x1',
    domain: 'workspace',
    name: 'Leave left',
    props: {
      label: 'Annual leave 2026',
      done: 3,
      target: 12,
      unit: 'days',
      startLeft: true,
      words: ['Taken', 'Left'],
    },
  }),

  /* Rate */
  rateUsd: rate({
    id: 'glance-rate-usd',
    size: '2x1',
    domain: 'banking',
    name: 'Dollar rate',
    props: {
      label: 'USD/IDR · mid',
      asOf: '14:02 WIB · Arunika Bank',
      quotes: [
        {
          id: 'idr',
          pair: 'Rupiah per US dollar',
          short: 'IDR per USD',
          value: 16284.5,
          decimals: 2,
          delta: 0.21,
          buy: 16210,
          sell: 16360,
          series: usdIdr,
        },
        {
          id: 'usd',
          pair: 'US dollars per IDR 1 million',
          short: 'USD per IDR 1 M',
          value: 61.41,
          decimals: 2,
          delta: -0.21,
          series: usdIdr.map((x) => Math.round((1e6 / x) * 100) / 100),
        },
      ],
    },
  }),
  rateSgd: rate({
    id: 'glance-rate-sgd',
    size: '1x1',
    domain: 'payments',
    name: 'Remittance rate',
    props: {
      label: 'SGD → IDR',
      quotes: [
        { id: 'sgd', pair: 'Rupiah per Singapore dollar', short: 'IDR per SGD', value: 12105, delta: 0.12 },
        { id: 'idr', pair: 'Singapore dollars per IDR 1 M', short: 'SGD per IDR 1 M', value: 82.61, decimals: 2, delta: -0.12 },
      ],
    },
  }),
  rateGold: rate({
    id: 'glance-rate-gold',
    size: '1x1',
    domain: 'commerce',
    surface: 'muted',
    name: 'Gold price',
    props: {
      label: 'Gold · 1 gram',
      quotes: [
        { id: 'buy', pair: 'Buy price, per gram', short: 'Buy price', value: 2312000, format: 'rp', delta: 0.64 },
        { id: 'back', pair: 'Buyback price, per gram', short: 'Buyback', value: 2168000, format: 'rp', delta: 0.71 },
      ],
    },
  }),
  rateCpo: rate({
    id: 'glance-rate-cpo',
    size: '2x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Palm oil price',
    props: {
      label: 'Crude palm oil · spot',
      asOf: '12:30 WIB · Dumai',
      quotes: [
        { id: 'kg', pair: 'Rupiah per kilogram, Dumai', short: 'IDR per kg', value: 14820, delta: -0.84, series: cpoKg },
        { id: 't', pair: 'Ringgit per tonne, futures', short: 'MYR per t', value: 4212, delta: -0.66, series: cpoT },
      ],
    },
  }),

  /* Spec sheet */
  specDb: spec({
    id: 'glance-spec-db',
    size: '2x2',
    domain: 'devops',
    props: {
      eyebrow: 'Database · primary',
      title: 'db-ledger-01',
      status: { tone: 'success', label: 'Healthy' },
      items: [
        { label: 'Endpoint', value: 'db-ledger-01.int', mono: true, copy: true },
        { label: 'Private IP', value: '10.12.4.18', mono: true, copy: true },
        { label: 'Engine', value: 'Relational · v16.4' },
        { label: 'Size', value: '8 vCPU · 32 GB' },
        { label: 'Region', value: 'ap-southeast-3', mono: true },
        { label: 'Up for', value: '41 days' },
      ],
    },
  }),
  specPass: spec({
    id: 'glance-spec-pass',
    size: '2x2',
    domain: 'aerospace',
    surface: 'dark',
    name: 'Pass sheet',
    props: {
      eyebrow: 'Next pass · Biak',
      title: 'NUSA-SAT 2',
      status: { tone: 'neutral', label: 'Scheduled' },
      items: [
        { label: 'AOS', value: '07:22:10 UTC', mono: true, copy: true },
        { label: 'LOS', value: '07:31:48 UTC', mono: true, copy: true },
        { label: 'Max elevation', value: '62.4°', mono: true },
        { label: 'Downlink', value: '8,212.5 MHz', mono: true, copy: true },
        { label: 'Rate', value: '150 Mbit/s', mono: true },
        { label: 'Antenna', value: 'Biak 2 · 7.3 m' },
      ],
    },
  }),
  specShipment: spec({
    id: 'glance-spec-shipment',
    size: '1x2',
    domain: 'logistics',
    name: 'Shipment sheet',
    props: {
      eyebrow: 'Shipment',
      title: 'NL-24-118342',
      status: { tone: 'success', label: 'On time' },
      layout: 'stack',
      items: [
        { label: 'Route', value: 'Cikarang → Makassar' },
        { label: 'ETA', value: '14 Nov · 06:00 WITA' },
        { label: 'Container', value: 'SKRU 418230-7', mono: true, copy: true },
        { label: 'Gross weight', value: '12,480 kg', mono: true },
      ],
    },
  }),

  /* Queue by severity */
  queueSoc: queue({
    id: 'glance-queue-soc',
    size: '4x1',
    domain: 'security',
    surface: 'dark',
    props: {
      label: 'Alert queue · SOC',
      noun: 'open',
      buckets: [
        { id: 'p1', label: 'P1', word: 'Critical', level: 'critical', count: 2, oldest: '42 min', item: 'Ransomware note on fs-02', who: 'Fajar Nugroho' },
        { id: 'p2', label: 'P2', word: 'High', level: 'serious', count: 9, oldest: '1 h 10 min', item: 'Impossible travel on 3 accounts', who: 'unassigned' },
        { id: 'p3', label: 'P3', word: 'Medium', level: 'warning', count: 31, oldest: '3 h 05 min', item: 'Mail rule forwarding outside', who: 'unassigned' },
        { id: 'p4', label: 'P4', word: 'Low', level: 'off', count: 112, oldest: '2 days', item: 'Port scan on the edge, blocked', who: 'auto-triage' },
      ],
    },
  }),
  queueSupport: queue({
    id: 'glance-queue-support',
    size: '2x2',
    domain: 'commerce',
    name: 'Support queue',
    props: {
      label: 'Support inbox · Racik',
      noun: 'waiting',
      layout: 'list',
      buckets: [
        { id: 'p1', label: 'P1', word: 'Urgent', level: 'critical', count: 3, oldest: '1 h 12 min', item: 'Paid twice for order RC-88214', who: 'Putri Maharani' },
        { id: 'p2', label: 'P2', word: 'High', level: 'warning', count: 12, oldest: '2 h 40 min', item: 'Courier lost a parcel to Medan' },
        { id: 'p3', label: 'P3', word: 'Normal', level: 'off', count: 48, oldest: '6 h', item: 'Change of delivery address' },
        { id: 'p4', label: 'P4', word: 'Low', level: 'off', count: 17, oldest: '1 day', item: 'Invoice with a company tax number' },
      ],
    },
  }),
  queueTriage: queue({
    id: 'glance-queue-triage',
    size: '2x2',
    domain: 'health',
    name: 'Triage queue',
    props: {
      label: 'ER triage · waiting',
      noun: 'waiting',
      layout: 'list',
      oldestWord: 'Longest',
      buckets: [
        { id: '1', label: '1', word: 'Resuscitation', level: 'critical', count: 0 },
        { id: '2', label: '2', word: 'Emergent', level: 'serious', count: 2, oldest: '8 min', item: 'Chest pain, 58 · bay 4' },
        { id: '3', label: '3', word: 'Urgent', level: 'warning', count: 7, oldest: '34 min', item: 'Fever and rash, 6 · bay 9' },
        { id: '4', label: '4', word: 'Less urgent', level: 'good', count: 11, oldest: '1 h 12 min', item: 'Wrist injury, 31 · chairs' },
        { id: '5', label: '5', word: 'Non-urgent', level: 'off', count: 3, oldest: '2 h 05 min', item: 'Prescription refill, 45 · chairs' },
      ],
    },
  }),
  queueReports: queue({
    id: 'glance-queue-reports',
    size: '3x1',
    domain: 'civic',
    surface: 'muted',
    name: 'Citizen reports',
    props: {
      label: 'Citizen reports · Tebet',
      noun: 'open',
      buckets: [
        { id: 'now', label: 'Now', word: 'Floods, trees', level: 'critical', count: 4, oldest: '35 min', item: 'Tree across Jalan Tebet Raya', who: 'Field team 1' },
        { id: 'today', label: 'Today', word: 'Lights, drains', level: 'warning', count: 18, oldest: '6 h', item: 'Blocked drain, Gang Sawo', who: 'Field team 2' },
        { id: 'week', label: 'Week', word: 'Roads, signs', level: 'off', count: 57, oldest: '5 days', item: 'Pothole outside SDN 01', who: 'unassigned' },
      ],
    },
  }),

  /* Reading in its band */
  bandVitals: band({
    id: 'glance-band-vitals',
    size: '2x2',
    domain: 'health',
    name: 'Vitals in range',
    props: {
      label: 'Bed 12 · Pak Hendra, 64',
      meta: '14:02 WIB',
      layout: 'list',
      readings: [
        { id: 't', label: 'Temp', value: 38.2, unit: '°C', decimals: 1, min: 35, max: 41, low: 36.1, high: 37.2, note: 'above since 13:40 WIB' },
        { id: 'hr', label: 'HR', value: 104, unit: 'bpm', min: 40, max: 160, low: 60, high: 100, note: 'up from 88 at 10:00 WIB' },
        { id: 'spo2', label: 'SpO₂', value: 95, unit: '%', min: 85, max: 100, low: 95, high: 100, note: 'on room air' },
        { id: 'rr', label: 'RR', value: 22, unit: '/min', min: 6, max: 36, low: 12, high: 20, note: 'counted at 14:00 WIB' },
        { id: 'bp', label: 'BP', value: 118, unit: 'mmHg', min: 70, max: 200, low: 90, high: 140, note: '118/76, systolic shown' },
      ],
    },
  }),
  bandHydro: band({
    id: 'glance-band-hydro',
    size: '2x1',
    domain: 'agri',
    surface: 'muted',
    name: 'Nutrient tank',
    props: {
      label: 'Nutrient tank · greenhouse 2',
      readings: [
        { id: 'ec', label: 'EC', value: 2.4, unit: 'mS/cm', decimals: 1, min: 0, max: 4, low: 1.8, high: 2.2 },
        { id: 'ph', label: 'pH', value: 6.1, unit: 'pH', decimals: 1, min: 4, max: 8, low: 5.5, high: 6.5 },
        { id: 'temp', label: 'Water', value: 24.8, unit: '°C', decimals: 1, min: 15, max: 35, low: 18, high: 26 },
      ],
    },
  }),
  bandPool: band({
    id: 'glance-band-pool',
    size: '1x1',
    domain: 'home',
    name: 'Pool water',
    props: {
      label: 'Pool water',
      readings: [
        { id: 'cl', label: 'Chlorine', value: 0.8, unit: 'ppm', decimals: 1, min: 0, max: 5, low: 1, high: 3 },
        { id: 'ph', label: 'pH', value: 7.4, unit: 'pH', decimals: 1, min: 6.5, max: 8.5, low: 7.2, high: 7.8 },
      ],
    },
  }),
  bandGrid: band({
    id: 'glance-band-grid',
    size: '2x1',
    domain: 'energy',
    surface: 'dark',
    name: 'Feeder in range',
    props: {
      label: 'Feeder CWG-07 · GI Cawang',
      readings: [
        { id: 'pf', label: 'Power factor', value: 0.82, unit: 'cos φ', decimals: 2, min: 0.6, max: 1, low: 0.85, high: 1 },
        { id: 'kv', label: 'Voltage', value: 20.4, unit: 'kV', decimals: 1, min: 18, max: 22, low: 19, high: 21 },
        { id: 'hz', label: 'Frequency', value: 50.02, unit: 'Hz', decimals: 2, min: 49.5, max: 50.5, low: 49.8, high: 50.2 },
      ],
    },
  }),

  /* Today by the hour */
  hoursTariff: hours({
    id: 'glance-hours-tariff',
    size: '3x1',
    domain: 'energy',
    name: 'Tariff today',
    props: {
      label: 'Grid tariff · industrial',
      states: [
        { id: 'off', word: 'Off-peak', fill: 'var(--r-seq-2)', note: 'Rp 1.036/kWh' },
        { id: 'peak', word: 'Peak', fill: 'var(--r-seq-6)', note: 'Rp 1.553/kWh' },
      ],
      hours: Array.from({ length: 24 }, (_, h) => (h >= 17 && h < 22 ? 'peak' : 'off')),
    },
  }),
  hoursBusy: hours({
    id: 'glance-hours-busy',
    size: '2x1',
    domain: 'commerce',
    name: 'Busy hours',
    props: {
      label: 'Busy hours · Toko Bu Ratna',
      values: [0, 0, 0, 0, 0, 4, 12, 18, 14, 11, 9, 13, 21, 17, 12, 10, 14, 26, 34, 29, 22, 15, 0, 0],
      unit: 'visitors',
      levels: [
        { upTo: 10, word: 'Quiet' },
        { upTo: 20, word: 'Steady' },
        { upTo: 999, word: 'Busy' },
      ],
    },
  }),
  hoursTransfer: hours({
    id: 'glance-hours-transfer',
    size: '3x1',
    domain: 'banking',
    name: 'Settlement windows',
    props: {
      label: 'Large transfers · when they settle',
      states: [
        { id: 'same', word: 'Same day', fill: 'var(--r-chart-1)', note: 'clears 15:00 WIB today' },
        { id: 'next', word: 'Next day', fill: 'var(--r-chart-context)', note: 'clears 09:00 WIB next working day' },
      ],
      hours: Array.from({ length: 24 }, (_, h) => (h >= 6 && h < 15 ? 'same' : 'next')),
    },
  }),
}

/* ── The chapter, ordered for rhythm: sizes, surfaces and domains alternate ─────────── */

export const entries: MoodEntry[] = [
  v.figureCash,
  v.lampServices,
  v.lcdWind,
  v.dialOil,
  v.clockTeam,
  v.balanceWallet,
  v.uptimeApi,
  v.signalLora,
  v.airRooms,
  v.matrixSensors,
  v.goalFund,
  v.nextTrain,
  v.ledTank,
  v.kpiShop,
  v.lampStations,
  v.rateSgd,
  v.weatherSpray,
  v.balanceSavings,
  v.bandPool,
  v.figureP95,
  v.dialPressure,
  v.queueSoc,
  v.lcdTempo,
  v.lampDoors,
  v.rangeVan,
  v.ringBeds,
  v.desksDepots,
  v.hoursBusy,
  v.presenceFloor,
  v.headingPatrol,
  v.rateGold,
  v.specDb,
  v.ledLoudness,
  v.nextMeeting,
  v.matrixCctv,
  v.goalLeave,
  v.lcdColdroom,
  v.figureRiders,
  v.bandHydro,
  v.lampLines,
  v.ringNodes,
  v.airCity,
  v.clockZulu,
  v.balanceTill,
  v.weatherCity,
  v.uptimeOntime,
  v.signalSatcom,
  v.nextDose,
  v.dialN1,
  v.ledDisk,
  v.kpiPayments,
  v.goalHarvest,
  v.lampFeeders,
  v.rangeScooter,
  v.specShipment,
  v.bandVitals,
  v.hoursTariff,
  v.presenceNewsroom,
  v.headingRunway,
  v.lcdRain,
  v.matrixPumps,
  v.rateUsd,
  v.figureSubscribers,
  v.queueSupport,
  v.ringParking,
  v.signalEdc,
  v.ledSilo,
  v.nextPayout,
  v.uptimeLogs,
  v.desksTreasury,
  v.airBedroom,
  v.kpiStream,
  v.dialFirewall,
  v.goalDonation,
  v.clockFamily,
  v.figureSolar,
  v.matrixReefers,
  v.headingWind,
  v.balanceTreasury,
  v.rangeDrone,
  v.queueTriage,
  v.ledFuel,
  v.weatherHome,
  v.signalUav,
  v.goalBudget,
  v.ringWarehouse,
  v.bandGrid,
  v.presenceShift,
  v.rateCpo,
  v.specPass,
  v.hoursTransfer,
  v.matrixMics,
  v.headingVessel,
  v.kpiWard,
  v.uptimeRail,
  v.nextPickup,
  v.rangeHome,
  v.airFence,
  v.desksBureaus,
  v.queueReports,
]
