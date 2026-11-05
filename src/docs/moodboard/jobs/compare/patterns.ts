/** The compare chapter's patterns: what every variant of each is, and why it earns a screen. */
import { archetype } from '../../kit'
import BulletOne from './BulletOne.vue'
import Bullets from './Bullets.vue'
import Bridge from './Bridge.vue'
import Candles from './Candles.vue'
import ColumnFocus from './ColumnFocus.vue'
import Diverging from './Diverging.vue'
import DotStrip from './DotStrip.vue'
import Funnel from './Funnel.vue'
import HeatWeek from './HeatWeek.vue'
import Histogram from './Histogram.vue'
import LastYear from './LastYear.vue'
import Leaderboard from './Leaderboard.vue'
import LineToggle from './LineToggle.vue'
import MonthSquares from './MonthSquares.vue'
import PickColumns from './PickColumns.vue'
import PlanTable from './PlanTable.vue'
import RangeDays from './RangeDays.vue'
import RankBars from './RankBars.vue'
import ScatterPick from './ScatterPick.vue'
import Schedule from './Schedule.vue'
import ShareBar from './ShareBar.vue'
import Slope from './Slope.vue'
import SmallMultiples from './SmallMultiples.vue'
import Tally from './Tally.vue'
import ThenNow from './ThenNow.vue'
import Waffle from './Waffle.vue'

export const thenNow = archetype(ThenNow, {
  name: 'Then and now',
  hint: 'Pick a column to read it, or use the arrow keys',
  why: 'Columns side by side show how far something moved before a sentence can say from what to what.',
  tags: ['before', 'after', 'columns', 'change'],
})

export const waffle = archetype(Waffle, {
  name: 'Out of a hundred',
  hint: 'Pick a group to light its squares; the squares between the two stay marked',
  why: 'A share drawn as a hundred squares can be counted, and the gap between two groups is a few marked squares, not a subtraction.',
  tags: ['share', 'waffle', 'percent', 'groups'],
})

export const pick = archetype(PickColumns, {
  name: 'Columns, pick one',
  hint: 'Point at a column to preview it, click to keep it; arrow keys walk the run',
  why: 'A run of columns shows the odd one out at once; asking for each day would take seven questions.',
  tags: ['columns', 'emphasis', 'average', 'select'],
})

export const slope = archetype(Slope, {
  name: 'Two points, one slope',
  hint: 'Pick an item by its label or its line; arrow keys move between items',
  why: 'Slopes show who rose, who fell and who overtook whom; a table of before and after makes the reader work it out.',
  tags: ['slope', 'before', 'after', 'rank'],
})

export const month = archetype(MonthSquares, {
  name: 'A month in squares',
  hint: 'Point at a day, or walk the days with the arrow keys; up and down move a week',
  why: 'A month of squares shows the wet week and the quiet weekend in one look; thirty-one numbers do not.',
  tags: ['calendar', 'heatmap', 'days', 'month'],
})

export const share = archetype(ShareBar, {
  name: 'Share of the whole',
  hint: 'Pick a part to compare it; switch the period and the parts move',
  why: 'Parts of one bar compare directly, and a shift in the mix shows as a moving edge rather than a list of percentages.',
  tags: ['share', 'composition', 'stacked', 'mix'],
})

export const strip = archetype(DotStrip, {
  name: 'Where it falls',
  hint: 'Point at a dot, or walk the dots in order of value with the arrow keys',
  why: 'One dot among its peers answers “are we high or low” better than a rank in a sentence.',
  tags: ['distribution', 'dots', 'rank', 'peers'],
})

export const hist = archetype(Histogram, {
  name: 'How it spreads',
  hint: 'Switch the period; point at a bin or use the arrow keys to read it',
  why: 'An average hides the long tail; the shape of the spread shows it, and the outline shows how it moved.',
  tags: ['histogram', 'distribution', 'percentile', 'before', 'after'],
})

export const bullet = archetype(BulletOne, {
  name: 'Measure against target',
  hint: 'Switch the period with the keys in the corner',
  why: 'A bar, a tick and three bands say how close to target in less room than the sentence that explains it.',
  tags: ['bullet', 'target', 'kpi'],
})

export const board = archetype(Leaderboard, {
  name: 'Rank and its change',
  hint: 'Switch the period and the rows re-rank; pick a row, or use the arrow keys, to read it',
  why: 'Order and movement read together in a ranked list with arrows; spelled out they are two separate answers.',
  tags: ['leaderboard', 'rank', 'change'],
})

export const funnel = archetype(Funnel, {
  name: 'Where it narrows',
  hint: 'Pick a step to read what was kept; switch the period to compare',
  why: 'The step that loses the most people stands out in the shape; in a paragraph it is one number among five.',
  tags: ['funnel', 'conversion', 'steps', 'drop'],
})

export const diverging = archetype(Diverging, {
  name: 'Over and under',
  hint: 'Sort by size or name; pick a row, or use the arrow keys, to read the figures behind it',
  why: 'Bars either side of zero show which way and how far at once; a list of signed numbers is read one sign at a time.',
  tags: ['diverging', 'variance', 'budget', 'signed'],
})

export const multiples = archetype(SmallMultiples, {
  name: 'Panels on one scale',
  hint: 'Switch between a shared and an own scale; press a panel to hold it in colour',
  why: 'Small panels on one scale compare amounts; on their own scales they compare shapes. No sentence does both.',
  tags: ['small multiples', 'sparkline', 'scale', 'panels'],
})

export const plan = archetype(PlanTable, {
  name: 'Side by side',
  hint: 'Pick a column; switch on Only differences to drop the rows that match',
  why: 'Options in columns let the eye run along a row, and the differences are where it stops.',
  tags: ['table', 'plans', 'options', 'comparison'],
})

export const lines = archetype(LineToggle, {
  name: 'Lines you can switch',
  hint: 'Switch a series with its chip; Tab into the plot and use the arrow keys to read the points',
  why: 'Lines on one scale show which one drifted and when; a sentence can only list them.',
  tags: ['line', 'series', 'toggle', 'legend'],
})

export const lastYear = archetype(LastYear, {
  name: 'This year over last',
  hint: 'Pick the year behind; the readout compares the two at now',
  why: 'The same weeks a year apart on one axis show whether this year runs ahead long before the total is in.',
  tags: ['line', 'year over year', 'now', 'forecast'],
})

export const rank = archetype(RankBars, {
  name: 'Ranked, with a switch',
  hint: 'Switch the measure and the list re-ranks; arrow keys read each bar',
  why: 'Bars in order make the leader and the long tail obvious, and switching the measure shows the order is not fixed.',
  tags: ['bar list', 'rank', 'sort', 'measure'],
})

export const cols = archetype(ColumnFocus, {
  name: 'Columns, one in focus',
  hint: 'Click a column or step with the arrows in the corner',
  why: 'One column in colour against the rest in grey answers “how was that day” with its context still on screen.',
  tags: ['columns', 'target', 'highlight'],
})

export const bullets = archetype(Bullets, {
  name: 'Against the target, row by row',
  hint: 'Switch the period; Tab into the chart and use the arrow keys to read each row',
  why: 'Several measures with their own targets line up down one column, and the misses are the bars that stop short of the tick.',
  tags: ['bullet', 'targets', 'kpi'],
})

export const bridge = archetype(Bridge, {
  name: 'From one total to the next',
  hint: 'Switch the period; arrow keys read each step',
  why: 'A bridge shows which steps made the change between two totals; the totals alone hide it.',
  tags: ['waterfall', 'bridge', 'cash flow'],
})

export const scatter = archetype(ScatterPick, {
  name: 'Two measures at once',
  hint: 'Show one group or all; point at a dot or use the arrow keys',
  why: 'Two measures per item push the outliers into a corner of the plot; a table would need sorting twice.',
  tags: ['scatter', 'outliers', 'limit'],
})

export const heat = archetype(HeatWeek, {
  name: 'Hour by day',
  hint: 'Switch the measure; point at a cell or move with the arrow keys',
  why: 'A week of hours as cells shows the busy hours as a shape; 168 numbers would not.',
  tags: ['heatmap', 'week', 'hours'],
})

export const candles = archetype(Candles, {
  name: 'Open, high, low, close',
  hint: 'Switch the range or the volume strip; arrow keys read each candle',
  why: 'Four prices a period read as one mark each; in words it is four numbers times forty.',
  tags: ['candles', 'price', 'ohlc', 'volume'],
})

export const ranges = archetype(RangeDays, {
  name: 'Low to high, per day',
  hint: 'Switch the series; arrow keys read each day',
  why: 'A spread per day shows the unsettled days in a look; an average flattens exactly the days that matter.',
  tags: ['range', 'spread', 'daily', 'min max'],
})

export const tally = archetype(Tally, {
  name: 'Counted in dots',
  hint: 'Switch a group off with its chip; arrow keys read each column',
  why: 'Dots of one size make counts tangible and stack groups without a second scale.',
  tags: ['dot matrix', 'tally', 'counts', 'led'],
})

export const schedule = archetype(Schedule, {
  name: 'Side by side in time',
  hint: 'Click a window, or step to it with the arrow keys and press Enter',
  why: 'Windows on one clock show overlaps and gaps at once; a list of start and end times has to be compared by hand.',
  tags: ['gantt', 'schedule', 'now', 'windows'],
})
