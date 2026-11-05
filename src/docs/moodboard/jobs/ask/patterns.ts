/**
 * The chapter's patterns: each one a screen that a conversation used to need, reduced to the
 * moment a person has to check something. Variants live in `variants-*.ts`; `index.ts` orders them.
 */
import { archetype } from '../../kit'
import AgentSteps from './AgentSteps.vue'
import AskFigure from './AskFigure.vue'
import AskWhy from './AskWhy.vue'
import ChangeDigest from './ChangeDigest.vue'
import ChatConfirm from './ChatConfirm.vue'
import CitedAnswer from './CitedAnswer.vue'
import ClarifyQuestion from './ClarifyQuestion.vue'
import CommandLine from './CommandLine.vue'
import DraftApproval from './DraftApproval.vue'
import ExplainChart from './ExplainChart.vue'
import FieldsToSentence from './FieldsToSentence.vue'
import FormFromSentence from './FormFromSentence.vue'
import GeneratedOptions from './GeneratedOptions.vue'
import GhostSuggest from './GhostSuggest.vue'
import Handoff from './Handoff.vue'
import MemoryNote from './MemoryNote.vue'
import RateAnswer from './RateAnswer.vue'
import RuleFromSentence from './RuleFromSentence.vue'
import ScheduleSentence from './ScheduleSentence.vue'
import SmartReplies from './SmartReplies.vue'
import ThreadSummary from './ThreadSummary.vue'
import ToolConfirm from './ToolConfirm.vue'
import Translate from './Translate.vue'
import VoiceCapture from './VoiceCapture.vue'

export const chat = archetype(ChatConfirm, {
  name: 'Chat to confirm',
  hint: 'Type or pick a suggestion; confirm the card, or press Change and say what to change',
  why: 'The conversation works out what to do; a screen appears only for the one thing a person must confirm.',
  tags: ['chat', 'conversation', 'confirm', 'card', 'message'],
})

export const figure = archetype(AskFigure, {
  name: 'Answer with its working',
  hint: 'Ask in the field or pick a follow-up; open the working to check how the figure was made',
  why: 'A figure answered in a sentence still needs its working shown, so a person can trust it before acting on it.',
  tags: ['answer', 'figure', 'question', 'sources', 'working'],
})

export const cited = archetype(CitedAnswer, {
  name: 'Answer with citations',
  hint: 'Ask a question; press a numbered source to read the passage it came from',
  why: 'A policy answer is only worth something when the paragraph behind it is one press away.',
  tags: ['answer', 'citation', 'policy', 'sources', 'document'],
})

export const draft = archetype(DraftApproval, {
  name: 'Draft to approve',
  hint: 'Approve it as written, edit the open fields, or discard it; undo for ten seconds after',
  why: 'The model writes the draft; the screen is there so a person reads it once and owns what goes out.',
  tags: ['draft', 'approve', 'edit', 'review'],
})

export const clarify = archetype(ClarifyQuestion, {
  name: 'One question back',
  hint: 'Pick the answer that fits, or choose Something else and type it',
  why: 'When a request could mean two things, one question with the likely answers beats a form that asks for everything.',
  tags: ['clarify', 'question', 'quick reply', 'ambiguous'],
})

export const steps = archetype(AgentSteps, {
  name: 'Agent at work',
  hint: 'Watch the steps tick by; Stop holds it between steps, Resume carries on',
  why: 'When the model works for a minute, a person needs to see the step it is on and to be able to stop it.',
  tags: ['agent', 'steps', 'progress', 'stop', 'live'],
})

export const form = archetype(FormFromSentence, {
  name: 'Form from a sentence',
  hint: 'Describe it and press Enter; click a field to correct it, pick a key for what is missing',
  why: 'A person describes the thing once; the screen shows only the fields it filled and the one it still needs.',
  tags: ['form', 'sentence', 'fields', 'parse', 'booking'],
})

export const voice = archetype(VoiceCapture, {
  name: 'Push to talk',
  hint: 'Hold the key, or hold Space, while you speak; release to see what was understood',
  why: 'With hands busy, speech is the input; the screen shows only what was heard and what it became.',
  tags: ['voice', 'speech', 'hold', 'transcript', 'field'],
})

export const explain = archetype(ExplainChart, {
  name: 'Explain this point',
  hint: 'Pick a column with the pointer or the arrow keys, then press Enter or Explain',
  why: 'A chart shows the bump; asking why on the chart is faster than opening the reports behind it.',
  tags: ['chart', 'explain', 'why', 'anomaly'],
})

export const cli = archetype(CommandLine, {
  name: 'Command from a sentence',
  hint: 'Type what to do and read the command under the field before Enter; ↑ and ↓ walk the history',
  why: 'Saying the intent is faster than finding the command; the exact command shows first, so a person can check it.',
  tags: ['command', 'terminal', 'history', 'keyboard'],
})

export const ghost = archetype(GhostSuggest, {
  name: 'Tab to accept',
  hint: 'Type; Tab takes the grey suggestion, → takes one word, Esc dismisses it',
  why: 'The model finishes the line in grey and one key accepts it, so the words stay the person’s own.',
  tags: ['autocomplete', 'suggestion', 'keyboard', 'writing'],
})

export const thread = archetype(ThreadSummary, {
  name: 'Thread in three lines',
  hint: 'Press a number to read the message behind a line; Show all opens the whole thread',
  why: 'A long thread becomes three lines a person can trust, because every line points back to its messages.',
  tags: ['summary', 'thread', 'citation', 'messages'],
})

export const translate = archetype(Translate, {
  name: 'Translate ID ↔ EN',
  hint: 'Type in either language; swap the direction, and pick the tone for Indonesian',
  why: 'Translation is a conversation job; both versions side by side let a person check the meaning before sending.',
  tags: ['translate', 'indonesian', 'english', 'language'],
})

export const replies = archetype(SmartReplies, {
  name: 'Suggested replies',
  hint: 'Pick a reply, check or change it, then send',
  why: 'Most answers to a message are one of three; picking and checking beats typing it on a phone.',
  tags: ['reply', 'message', 'suggestion', 'chat'],
})

export const digest = archetype(ChangeDigest, {
  name: 'What changed',
  hint: 'Pick the period; open a line to read why it moved',
  why: 'A dashboard makes a person hunt for what moved; four plain lines say it, each with its reason.',
  tags: ['digest', 'summary', 'changes', 'since'],
})

export const tool = archetype(ToolConfirm, {
  name: 'Let it run?',
  hint: 'Read exactly what will run and where, then Run or Not now',
  why: 'The model can write the call; running it against the real thing is a person’s decision.',
  tags: ['tool call', 'confirm', 'permission', 'agent'],
})

export const memory = archetype(MemoryNote, {
  name: 'Remembered',
  hint: 'Forget removes it at once; Undo puts it back',
  why: 'What the model keeps about a person should be visible and removable in one press, not buried in settings.',
  tags: ['memory', 'privacy', 'forget', 'preference'],
})

export const handoff = archetype(Handoff, {
  name: 'Hand to a person',
  hint: 'Choose what goes along, hand it off, and watch the place in line',
  why: 'Some cases need a person; the hand-off carries the story along so nobody has to tell it twice.',
  tags: ['handoff', 'human', 'support', 'queue'],
})

export const rate = archetype(RateAnswer, {
  name: 'Was this right?',
  hint: 'Answer Yes or No; after No, pick what was wrong',
  why: 'Feedback on an answer is one press and one reason; a survey screen would never be filled in.',
  tags: ['feedback', 'rating', 'answer'],
})

export const schedule = archetype(ScheduleSentence, {
  name: 'Book by sentence',
  hint: 'Say when and with whom and press Enter; pick a slot, then Book',
  why: '“Thursday after lunch with Rina” says what a calendar grid makes a person hunt for.',
  tags: ['schedule', 'calendar', 'sentence', 'slot'],
})

export const options = archetype(GeneratedOptions, {
  name: 'Pick one of three',
  hint: 'Pick with the arrow keys or the pointer; Three more drafts another round',
  why: 'Writing from nothing is slow and judging is fast: the model drafts three and a person picks.',
  tags: ['generate', 'options', 'copy', 'pick'],
})

export const fields = archetype(FieldsToSentence, {
  name: 'Fields into one sentence',
  hint: 'Switch between the form and the sentence; point at a phrase to see the fields it fills',
  why: 'The fields still exist, but a person says one sentence and checks which words filled which field.',
  tags: ['form', 'sentence', 'before and after', 'fields'],
})

export const rule = archetype(RuleFromSentence, {
  name: 'Rule in a sentence',
  hint: 'Say the rule and press Enter; check When, If and Then, then switch it on',
  why: 'Rule builders are a maze of dropdowns; a sentence says it and the screen reads it back to check.',
  tags: ['rule', 'automation', 'alert', 'sentence'],
})

export const why = archetype(AskWhy, {
  name: 'Ask why',
  hint: 'Press the question for the reason behind the figure; Back returns to it',
  why: 'A surprising number gets one question, answered where the number is, with where the answer came from.',
  tags: ['why', 'figure', 'explain', 'answer'],
})
