#!/usr/bin/env bun
// colorful/ 保留多色 fill/stroke；normal/ 仅做保守的黑/#000 → currentColor 替换，其余原样保留。
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { kebabBasenameToComponentName } from './icon-naming'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = join(__dirname, '..')

/** 与模板约定同步递增；变更生成模板时必须 bump，否则 mtime/hash 跳过会漏更新 */
const GEN_TAG = 'gen:4'

const SOURCES = [
  { glob: 'src/svg/normal/**/*.svg', outDir: 'src/vue/normal', mono: true },
  { glob: 'src/svg/colorful/**/*.svg', outDir: 'src/vue/colorful', mono: false }
] as const

function fileBasenameToComponentName(fileBase: string): string {
  return kebabBasenameToComponentName(fileBase.replace(/\.svg$/i, ''))
}

function shortHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

function parseSvgRoot(svg: string): { attrs: Record<string, string>; inner: string } {
  const m = svg.trim().match(/^<svg\s([^>]*)>([\s\S]*)<\/svg>\s*$/i)
  if (!m) throw new Error('Invalid SVG root')
  const attrStr = m[1]!.trim()
  const inner = m[2]!
  const attrs: Record<string, string> = {}
  const re = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g
  let mm: RegExpExecArray | null
  while ((mm = re.exec(attrStr))) {
    attrs[mm[1]!] = (mm[3] ?? mm[4] ?? '').trim()
  }
  return { attrs, inner }
}

/** 单色目录：将常见纯黑填色归一为 currentColor（colorful 跳过） */
function normalizeMonochromeSvgFragment(fragment: string): string {
  return (
    fragment
      .replace(/\bfill\s*=\s*["']#000000["']/gi, 'fill="currentColor"')
      .replace(/\bfill\s*=\s*["']#000["']/gi, 'fill="currentColor"')
      .replace(/\bfill\s*=\s*["']black["']/gi, 'fill="currentColor"')
      .replace(/\bstroke\s*=\s*["']#000000["']/gi, 'stroke="currentColor"')
      .replace(/\bstroke\s*=\s*["']#000["']/gi, 'stroke="currentColor"')
      .replace(/\bstroke\s*=\s*["']black["']/gi, 'stroke="currentColor"')
      // rgb(0,0,0) 等形式较少见于已 SVGO 产物，保留简单替换
      .replace(/\bfill\s*=\s*["']rgb\s*\(\s*0\s*,\s*0\s*,\s*0\s*\)["']/gi, 'fill="currentColor"')
      .replace(
        /\bstroke\s*=\s*["']rgb\s*\(\s*0\s*,\s*0\s*,\s*0\s*\)["']/gi,
        'stroke="currentColor"'
      )
  )
}

function serializeSvgAttrs(attrs: Record<string, string>): string {
  const skip = new Set(['width', 'height'])
  const parts: string[] = []
  for (const [k, v] of Object.entries(attrs)) {
    if (skip.has(k.toLowerCase())) continue
    parts.push(`${k}="${v.replace(/"/g, '&quot;')}"`)
  }
  return parts.join('\n    ')
}

async function collectGlobFiles(pattern: string): Promise<string[]> {
  const matcher = new Bun.Glob(pattern)
  const rels = await Array.fromAsync(matcher.scan({ cwd: PKG_ROOT }))
  return rels.map((rel) => join(PKG_ROOT, rel))
}

let written = 0
let skipped = 0

const sourceFiles = await Promise.all(
  SOURCES.map(async ({ glob, outDir, mono }) => ({
    outDir,
    mono,
    files: (await collectGlobFiles(glob)).toSorted()
  }))
)

for (const { outDir, mono, files } of sourceFiles) {
  for (const abs of files) {
    const svgRaw = readFileSync(abs, 'utf8')
    const hash = shortHash(svgRaw)
    const baseName = basename(abs, '.svg')
    const name = fileBasenameToComponentName(baseName)
    const relSvg = relative(PKG_ROOT, abs).replaceAll('\\', '/')
    const outAbs = join(PKG_ROOT, outDir, `${baseName}.vue`)

    let inner: string
    let svgOpen: string
    try {
      const { attrs, inner: rawInner } = parseSvgRoot(svgRaw)
      inner = mono ? normalizeMonochromeSvgFragment(rawInner) : rawInner
      const rest = serializeSvgAttrs(attrs)
      svgOpen = rest ? `  <svg\n    ${rest}\n  >` : '  <svg>'
    } catch (e) {
      console.error(`parse failed: ${relSvg}`, e)
      process.exit(1)
    }

    const vue = `<!-- @veltra/icons generated sha256:${hash} ${GEN_TAG} source:${relSvg} -->
<script setup lang="ts">
defineOptions({ name: '${name}' })
</script>
<template>
${svgOpen}
${inner.replace(/^/gm, '    ')}
  </svg>
</template>
`

    let skipWrite = false
    try {
      const existing = readFileSync(outAbs, 'utf8')
      const hm = existing.match(/sha256:([a-f0-9]+)/)
      if (hm && hm[1] === hash && existing.includes(GEN_TAG)) skipWrite = true
    } catch {
      /* no file */
    }

    if (skipWrite) {
      skipped++
      continue
    }

    mkdirSync(dirname(outAbs), { recursive: true })
    writeFileSync(outAbs, vue, 'utf8')
    written++
  }
}

console.log(`Vue 图标生成: 写入 ${written}，跳过(未变) ${skipped}`)
