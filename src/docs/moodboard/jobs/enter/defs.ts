/** The chapter's patterns: one archetype each, with what is true of every variant. */
import { archetype } from '../../kit'
import AmountField from './AmountField.vue'
import AmountKeypad from './AmountKeypad.vue'
import Autocomplete from './Autocomplete.vue'
import ColourPick from './ColourPick.vue'
import DatePick from './DatePick.vue'
import DropZone from './DropZone.vue'
import EmailField from './EmailField.vue'
import KeypadCode from './KeypadCode.vue'
import LookupField from './LookupField.vue'
import NoteCount from './NoteCount.vue'
import OtpCode from './OtpCode.vue'
import Passphrase from './Passphrase.vue'
import PhoneField from './PhoneField.vue'
import PinDrop from './PinDrop.vue'
import QtyStepper from './QtyStepper.vue'
import RatingScale from './RatingScale.vue'
import RecentSearch from './RecentSearch.vue'
import ScanFrame from './ScanFrame.vue'
import SeatPick from './SeatPick.vue'
import ShortcutCapture from './ShortcutCapture.vue'
import SignaturePad from './SignaturePad.vue'
import TagInput from './TagInput.vue'
import TimeField from './TimeField.vue'
import TimeRange from './TimeRange.vue'
import UnitConvert from './UnitConvert.vue'

export const otp = archetype(OtpCode, {
  name: 'One-time code',
  hint: 'Type or paste the code; arrows move between boxes, Backspace goes back',
  why: 'A code read off a phone is typed in two seconds; reading it aloud is slower and leaks it.',
  tags: ['code', 'otp', 'verify', 'paste', 'digits'],
})

export const amount = archetype(AmountField, {
  name: 'Amount',
  hint: 'Type an amount; 250rb, 1,5jt and 2 juta work; or pick a quick amount',
  why: 'An exact amount is typed faster than it is said, and the field reads it back in full before money moves.',
  tags: ['amount', 'money', 'rupiah', 'currency', 'field'],
})

export const keypad = archetype(AmountKeypad, {
  name: 'Amount keypad',
  hint: 'Tap the keys or type digits; 000 adds the thousands, Backspace deletes, Enter takes it',
  why: 'At a till or a pump, a thumb on a keypad finds the figure faster than any sentence about money.',
  tags: ['keypad', 'amount', 'pos', 'rupiah', 'tap'],
})

export const keycode = archetype(KeypadCode, {
  name: 'Keypad code',
  hint: 'Tap or type the digits; Backspace deletes, Enter sends',
  why: 'A code printed on a receipt or a slip goes in key by key, with the display showing each one back.',
  tags: ['keypad', 'code', 'pin', 'token', 'tap'],
})

export const phone = archetype(PhoneField, {
  name: 'Phone number',
  hint: 'Type or paste the number; a leading 0 is dropped and +65 picks the country',
  why: 'A number copied off a slip is typed once; the field groups it and catches the missing digit.',
  tags: ['phone', 'field', 'format', 'sms'],
})

export const email = archetype(EmailField, {
  name: 'Email address',
  hint: 'Type an address and press Enter; a likely typo gets a one-tap fix',
  why: 'An address must be spelled exactly once; the field checks it and catches the typo before it bounces.',
  tags: ['email', 'field', 'validate', 'invite'],
})

export const date = archetype(DatePick, {
  name: 'Date pick',
  hint: 'Click a day or walk with the arrow keys; Page Up and Page Down turn the month',
  why: 'A day on a month is one tap; “the Wednesday after next” has to be worked out before it can be said.',
  tags: ['date', 'calendar', 'month', 'pick'],
})

export const time = archetype(TimeField, {
  name: 'Time, 24 hours',
  hint: 'Type four digits, like 1430; the colon and the rounding are done for you',
  why: 'A time is four digits; the field adds the colon, keeps 24 hours and says what the time means.',
  tags: ['time', 'clock', '24h', 'field'],
})

export const range = archetype(TimeRange, {
  name: 'Time window',
  hint: 'Type the start and the end; the strip draws the window, across midnight too',
  why: 'Two typed times and a drawn window settle what “late tonight until early” leaves open.',
  tags: ['time', 'range', 'window', 'schedule'],
})

export const auto = archetype(Autocomplete, {
  name: 'Autocomplete',
  hint: 'Type a few letters; arrow keys walk the list, Enter picks, Escape closes',
  why: 'Three letters find the place; the list shows which one was meant before it is used.',
  tags: ['autocomplete', 'combobox', 'search', 'place'],
})

export const search = archetype(RecentSearch, {
  name: 'Search with recents',
  hint: 'Type and press Enter, or pick a recent search; × forgets one',
  why: 'Most searches are repeats; the last few sit one press away instead of being typed or asked again.',
  tags: ['search', 'recent', 'history', 'find'],
})

export const tags = archetype(TagInput, {
  name: 'Tag input',
  hint: 'Type and press Enter or a comma; Backspace takes the last one back',
  why: 'A short list of exact words is typed once each and kept as chips a person can check.',
  tags: ['tags', 'chips', 'labels', 'list'],
})

export const rate = archetype(RatingScale, {
  name: 'Rating squares',
  hint: 'Click a square, or use the arrow and number keys',
  why: 'A score is one tap on a scale whose ends are labelled; a sentence about it can come after.',
  tags: ['rating', 'score', 'scale', 'feedback'],
})

export const qty = archetype(QtyStepper, {
  name: 'Quantity',
  hint: 'Type a number or use − and +; arrow keys step, the maximum is beside it',
  why: 'How many is a number; the stock beside the field stops an order that cannot be filled.',
  tags: ['quantity', 'stepper', 'stock', 'number'],
})

export const pass = archetype(Passphrase, {
  name: 'New passphrase',
  hint: 'Type it, or let Suggest make one; the eye shows or hides it',
  why: 'A secret is typed, never said aloud, and the meter says in words whether it holds.',
  tags: ['password', 'passphrase', 'strength', 'secret'],
})

export const note = archetype(NoteCount, {
  name: 'Note with a count',
  hint: 'Type the note; the count under it says what fits and what it costs',
  why: 'A short text with a hard limit is written by hand, and the count shows what fits while it is written.',
  tags: ['text', 'note', 'count', 'sms', 'limit'],
})

export const colour = archetype(ColourPick, {
  name: 'Identity colour',
  hint: 'Click a swatch or move with the arrow keys',
  why: 'A colour is recognised, not described; eight swatches settle it in one tap.',
  tags: ['colour', 'swatch', 'identity', 'pick'],
})

export const unit = archetype(UnitConvert, {
  name: 'Unit pair',
  hint: 'Type in either field and the other follows; swap flips them',
  why: 'A figure arrives in the other unit; typing it as it was read beats asking for the conversion.',
  tags: ['unit', 'convert', 'number', 'field'],
})

export const pin = archetype(PinDrop, {
  name: 'Pin on a map',
  hint: 'Click or drag on the map, nudge with the arrow keys, or type the coordinates',
  why: 'Where exactly is something a finger finds in a second; describing it takes a paragraph and still misses.',
  tags: ['map', 'pin', 'coordinates', 'location', 'drag'],
})

export const sign = archetype(SignaturePad, {
  name: 'Signature',
  hint: 'Draw on the line with a mouse, pen or finger; or use Type instead',
  why: 'A signature is a gesture, not a sentence; drawing it is the proof that this person was here.',
  tags: ['signature', 'draw', 'consent', 'proof'],
})

export const drop = archetype(DropZone, {
  name: 'File drop',
  hint: 'Drop a file, click to browse, or try the sample; × removes it',
  why: 'Dropping the file is exact; naming it in a sentence is how the wrong one gets sent.',
  tags: ['file', 'upload', 'drop', 'import'],
})

export const scan = archetype(ScanFrame, {
  name: 'Scan frame',
  hint: 'Press Scan to let the camera find the code, or type the code under it',
  why: 'Pointing a camera at a code is faster and surer than reading its digits out.',
  tags: ['scan', 'qr', 'barcode', 'camera'],
})

export const seat = archetype(SeatPick, {
  name: 'Seat pick',
  hint: 'Click a free seat, or move with the arrow keys and press Enter',
  why: 'A seat is chosen by where it is; the map shows the window, the aisle and the exit row at once.',
  tags: ['seat', 'map', 'booking', 'pick'],
})

export const keys = archetype(ShortcutCapture, {
  name: 'Key capture',
  hint: 'Click the field, then press the keys; Backspace clears, Escape keeps the old one',
  why: 'Pressing the keys says exactly which keys; spelling a shortcut out loud never does.',
  tags: ['keyboard', 'shortcut', 'hotkey', 'record'],
})

export const lookup = archetype(LookupField, {
  name: 'Lookup by number',
  hint: 'Type or paste the number and press Enter; the name comes back to check',
  why: 'An account number is copied, not dictated; the name it resolves to is the check before anything moves.',
  tags: ['lookup', 'account', 'id', 'verify', 'field'],
})
