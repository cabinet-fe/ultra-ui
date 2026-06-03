#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const COMPONENTS_DIR = join(REPO_ROOT, 'skills/veltra-ui/packages/desktop/components')

function extractPrimaryComponentName(titleLine: string): string {
  const match = titleLine.match(/\bU[A-Z][A-Za-z0-9]*/)

  return match?.[0] ?? 'UComponent'
}

function splitMultipleCodeBlocks(sectionBody: string): string[] {
  const blocks: string[] = []
  const regex = /```[\s\S]*?```/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(sectionBody)) !== null) {
    blocks.push(match[0].trim())
  }

  return blocks
}

function normalizeExampleSections(rawExamples: string): string {
  const lines = rawExamples.replace(/\r\n/g, '\n').split('\n')
  const sections: { title: string; body: string }[] = []
  let currentTitle = ''
  let currentBody: string[] = []

  const flush = (): void => {
    if (!currentTitle) {
      return
    }

    const body = currentBody.join('\n').trim()
    const codeBlocks = splitMultipleCodeBlocks(body)

    if (codeBlocks.length === 0) {
      sections.push({ title: currentTitle, body })
      return
    }

    if (codeBlocks.length === 1) {
      sections.push({ title: currentTitle, body: codeBlocks[0]! })
      return
    }

    codeBlocks.forEach((block, index) => {
      const suffix = index === 0 ? '' : '（续）'
      sections.push({ title: `${currentTitle}${suffix}`, body: block })
    })
  }

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flush()
      currentTitle = line.slice(4).trim()
      currentBody = []
      continue
    }

    if (line.startsWith('## Examples')) {
      continue
    }

    if (currentTitle) {
      currentBody.push(line)
    }
  }

  flush()

  return sections.map(({ title, body }) => `## ${title}\n\n${body}`).join('\n\n')
}

function migrateComponentDoc(
  content: string,
  fileName: string
): { main: string; examples: string | null } {
  const normalized = content.replace(/\r\n/g, '\n')
  const examplesIndex = normalized.search(/^## Examples\s*$/m)

  if (examplesIndex === -1) {
    return { main: normalized, examples: null }
  }

  const mainPart = normalized.slice(0, examplesIndex).trimEnd()
  const examplesPart = normalized.slice(examplesIndex)
  const titleLine = mainPart.split('\n')[0] ?? '# UComponent'
  const componentName = extractPrimaryComponentName(titleLine)
  const baseName = basename(fileName, '.md')
  const normalizedExamples = normalizeExampleSections(examplesPart)
  const examplesDoc = `# ${componentName} 示例\n\n${normalizedExamples}\n`
  const mainDoc = `${mainPart}\n\n> 示例见 [${baseName}.examples.md](./${baseName}.examples.md)\n`

  return { main: mainDoc, examples: examplesDoc }
}

async function main(): Promise<void> {
  const entries = await readdir(COMPONENTS_DIR)
  const mdFiles = entries
    .filter((name) => name.endsWith('.md') && !name.endsWith('.examples.md'))
    .toSorted()

  const results = await Promise.all(
    mdFiles.map(async (fileName) => {
      const filePath = join(COMPONENTS_DIR, fileName)
      const content = await readFile(filePath, 'utf8')
      const { main, examples } = migrateComponentDoc(content, fileName)

      if (!examples) {
        return { migrated: false }
      }

      await writeFile(filePath, main, 'utf8')
      await writeFile(
        join(COMPONENTS_DIR, fileName.replace(/\.md$/, '.examples.md')),
        examples,
        'utf8'
      )
      return { migrated: true }
    })
  )

  const migrated = results.filter((result) => result.migrated).length
  const skipped = results.length - migrated

  console.log(`[migrate-skill-examples] migrated=${migrated} skipped=${skipped}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[migrate-skill-examples] ${message}`)
  process.exit(1)
})
