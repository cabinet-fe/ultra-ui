#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const COMPONENTS_DOC_DIR = join(REPO_ROOT, 'skills/veltra-ui/packages/desktop/components')

function shouldRemoveSection(heading: string): boolean {
  if (/专属|关联类型|函数式 API|Options|键盘快捷键|回调/.test(heading)) {
    return false
  }

  if (heading.startsWith('UMessage 组件')) {
    return true
  }

  if (/Props/.test(heading)) {
    return true
  }

  if (/Emits/.test(heading)) {
    return true
  }

  if (/Exposed/.test(heading)) {
    return true
  }

  if (/Slots/.test(heading)) {
    return true
  }

  return false
}

function shouldRemoveSubSection(heading: string): boolean {
  return /Props\s*\(/.test(heading) || heading === 'MessageConfirmProps'
}

function slimApiContent(content: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const result: string[] = []
  let skipping = false
  let skipLevel: 2 | 3 = 2

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/)
    const h3 = line.match(/^### (.+)$/)

    if (h2) {
      skipping = shouldRemoveSection(h2[1]!.trim())
      skipLevel = 2

      if (!skipping) {
        result.push(line)
      }

      continue
    }

    if (h3 && !skipping) {
      if (shouldRemoveSubSection(h3[1]!.trim())) {
        skipping = true
        skipLevel = 3
        continue
      }
    }

    if (h3 && skipping && skipLevel === 3) {
      skipping = false
      skipLevel = 2

      if (shouldRemoveSubSection(h3[1]!.trim())) {
        skipping = true
        skipLevel = 3
        continue
      }

      result.push(line)
      continue
    }

    if (skipping) {
      continue
    }

    result.push(line)
  }

  let slimmed = result.join('\n')
  slimmed = slimmed.replace(/^### MessageConfirmProps[\s\S]*?```\n[\s\S]*?```\n/m, '')
  slimmed = slimmed.replace(/> 示例见 \[[^\]]+\]\(\.\/[^)]+\)\n/g, '')
  slimmed = slimmed.replace(/\n{3,}/g, '\n\n').trimEnd()

  if (!slimmed.includes('[examples.md](./examples.md)')) {
    slimmed = `${slimmed}\n\n> 示例见 [examples.md](./examples.md)\n`
  }

  return slimmed
}

async function main(): Promise<void> {
  const entries = await readdir(COMPONENTS_DOC_DIR, { withFileTypes: true })
  const componentDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

  await Promise.all(
    componentDirs.map(async (kebab) => {
      const apiPath = join(COMPONENTS_DOC_DIR, kebab, 'api.md')

      try {
        const content = await readFile(apiPath, 'utf8')
        const slimmed = slimApiContent(content)
        await writeFile(apiPath, slimmed, 'utf8')
      } catch {
        // skip
      }
    })
  )

  console.log(`[slim-skill-component-api] slimmed ${componentDirs.length} api.md files`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
