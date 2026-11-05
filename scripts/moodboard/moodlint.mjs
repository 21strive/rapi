#!/usr/bin/env node
// Static checks of the Rapi rules over one moodboard chapter (or all):
//   node scripts/moodboard/moodlint.mjs <job|all>
// Prints file:line and the rule. "review" lines are allowed with a reason; "rule" lines are not.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/docs/moodboard/jobs')
const job = process.argv[2] ?? 'all'
const dirs = job === 'all' ? fs.readdirSync(ROOT) : [job]
const out = []
const add = (kind, file, line, msg, text) => out.push(`${kind.padEnd(6)} ${path.relative(ROOT, file)}:${line}  ${msg}  │ ${text.trim().slice(0, 110)}`)
const banned = /\b(seamless(ly)?|powerful|magic(al)?|revolutionar\w*|ai-powered|cutting-edge|effortless(ly)?|lorem|ipsum|supercharge\w*|game-?chang\w*|unleash\w*|delightful)\b/i
const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u
for (const d of dirs) {
  const dir = path.join(ROOT, d)
  if (!fs.statSync(dir).isDirectory()) continue
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(vue|ts)$/.test(f)) continue
    const file = path.join(dir, f)
    const src = fs.readFileSync(file, 'utf8')
    const lines = src.split('\n')
    let inStyle = false, inTemplate = false
    lines.forEach((text, i) => {
      const n = i + 1
      if (/^<style/.test(text)) inStyle = true
      if (/^<\/style>/.test(text)) inStyle = false
      if (/^<template>/.test(text)) inTemplate = true
      if (/^<\/template>/.test(text)) inTemplate = false
      const code = text.replace(/\/\/.*$|\/\*.*?\*\/|<!--.*?-->/g, '')
      if (inStyle) {
        if (/#[0-9a-fA-F]{3,8}\b/.test(code)) add('rule', file, n, 'hex colour in CSS (use tokens)', text)
        if (/\b(rgba?|hsla?|oklch|lab)\(/.test(code) && !/color-mix/.test(code)) add('rule', file, n, 'raw colour function (use tokens)', text)
        if (/\b(white|black|red|blue|green|orange|gray|grey|yellow)\b/.test(code) && /(color|background|fill|stroke|border)/.test(code) && !/var\(/.test(code)) add('rule', file, n, 'named colour (use tokens)', text)
        const br = code.match(/border(-[a-z-]+)?-radius\s*:\s*([^;]+)/)
        if (br && !/^\s*(0(px)?|var\(--r-radius-(round|none|surface|control|mark)\)|inherit)\s*$/.test(br[2])) add('rule', file, n, 'border-radius not 0 / round token', text)
        if (/box-shadow\s*:/.test(code) && !/none|var\(--r-shadow|var\(--r-focus-ring\)|inset 0 0 0|0 0 0 (1|2|3)px/.test(code)) add('review', file, n, 'shadow (only floating things get one)', text)
        if (/(linear|radial|conic)-gradient/.test(code)) add('review', file, n, 'gradient (only hatching/marks tricks allowed, never decoration)', text)
        if (/font-family\s*:/.test(code) && !/var\(--r-font-/.test(code) && !/inherit/.test(code)) add('rule', file, n, 'font-family not a Rapi font token', text)
        if (/backdrop-filter|filter\s*:\s*blur|text-shadow/.test(code)) add('rule', file, n, 'blur/glow/text-shadow', text)
        if (/cubic-bezier\([^)]*(1\.[1-9]|-0\.[1-9])/.test(code) || /\bbounce|spring\b/.test(code)) add('rule', file, n, 'overshooting easing / bounce', text)
        if (/transition[^;]*\b([3-9]\d\d|\d{4,})ms/.test(code)) add('review', file, n, 'slow transition (tokens are 70–240 ms)', text)
      } else {
        if (/(fill|stroke|color)=["']#[0-9a-fA-F]{3,8}/.test(code) || /(fill|stroke)=["'](white|black|red|blue|green|orange)/.test(code)) add('rule', file, n, 'hard-coded colour attribute', text)
        if (/['"`]#[0-9a-fA-F]{6}\b/.test(code) && !/id|ref|hash|sha|#\d/.test(code.toLowerCase().slice(0, 0))) add('review', file, n, 'hex string in script (colours must be tokens)', text)
        if (/<h[12][\s>]/.test(code)) add('rule', file, n, 'h1/h2 inside a tile (use p or h3)', text)
        if (/title-as=["']h2["']/.test(code)) add('rule', file, n, 'RCard title as h2 inside a tile', text)
        if (/\bsetInterval\(/.test(code)) add('review', file, n, 'setInterval (only short user-started timers; use useTick)', text)
        if (/requestAnimationFrame\(/.test(code)) add('review', file, n, 'rAF loop (must stop off screen / when done)', text)
        if (/\bautofocus\b|\.focus\(\)\s*$/.test(code) && /onMounted|autofocus/.test(code)) add('rule', file, n, 'focus stolen on load', text)
        if (/border-radius|rounded/.test(code) && /style=/.test(code)) add('review', file, n, 'inline radius/rounded', text)
        if (/Sparkles|Wand|Bot\b|BrainCircuit/.test(code) && /lucide/.test(src)) add('rule', file, n, 'AI cliché icon (sparkles/wand/bot)', text)
      }
      if (banned.test(code)) add('rule', file, n, 'marketing word or placeholder copy', text)
      if (emoji.test(code)) add('rule', file, n, 'emoji', text)
      if (/['"`>][^'"`<>]*[a-z]![\s'"`<]/i.test(code) && !/!==|!=|!\w|\(!|&&|\|\|/.test(code)) add('review', file, n, 'exclamation mark in copy?', text)
      if (/['"`][^'"`]*\s-\d[\d.,]*\s*(%|pp|ms|°|IDR|USD|Rp)/.test(code)) add('review', file, n, 'hyphen-minus before a figure in copy (use −)', text)
    })
    if (f === 'index.ts') {
      const ids = [...src.matchAll(/\(\{\s*id:\s*'([^']+)'/g)].map((m) => m[1])
      const bad = ids.filter((id) => !id.startsWith(`${d}-`))
      if (bad.length) add('rule', file, 0, `ids not prefixed "${d}-": ${bad.slice(0, 5).join(', ')}`, '')
      const dup = ids.filter((id, k) => ids.indexOf(id) !== k)
      if (dup.length) add('rule', file, 0, `duplicate ids: ${dup.join(', ')}`, '')
    }
  }
}
console.log(out.length ? out.join('\n') : 'clean')
console.log(`\n${out.filter((l) => l.startsWith('rule')).length} rule, ${out.filter((l) => l.startsWith('review')).length} review`)
