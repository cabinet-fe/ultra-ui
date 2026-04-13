#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(__dirname, '..')
const ROOT = join(__dirname, '../../..')
const STYLES_SRC = join(ROOT, 'packages/styles/src')
const GENERATED_DIR = join(SKILL_DIR, 'generated')

function fence(lang: string, pathFromSrc: string, content: string): string {
  const c = content.trimEnd()
  return `## \`${pathFromSrc}\`\n\n\`\`\`${lang}\n// 来源: packages/styles/src/${pathFromSrc}\n${c}\n\`\`\`\n`
}

interface Manifest {
  syncedAt: string
  outputs: Record<string, string[]>
}

async function main(): Promise<void> {
  console.log('[sync] syncing veltra-styles docs...')

  if (!existsSync(STYLES_SRC)) {
    console.error(`[sync] styles src not found: ${STYLES_SRC}`)
    process.exit(1)
  }

  await rm(GENERATED_DIR, { recursive: true, force: true })
  await mkdir(GENERATED_DIR, { recursive: true })

  const read = async (rel: string): Promise<string> => readFile(join(STYLES_SRC, rel), 'utf-8')

  const themeTokenFiles = ['theme/type.ts', 'theme/light.ts', 'theme/dark.ts'] as const
  const scssFiles = ['_mixins.scss', '_functions.scss', '_vars.scss'] as const
  const themeTsFiles = ['theme/ui-theme.ts', 'load-theme.ts', 'theme/helper.ts'] as const

  const themeTokens =
    '# Theme tokens（类型与 light/dark 预设）\n\n' +
    (
      await Promise.all(themeTokenFiles.map(async (f) => fence('typescript', f, await read(f))))
    ).join('\n')

  const scssApi =
    '# SCSS API（mixins / functions / vars）\n\n' +
    (await Promise.all(scssFiles.map(async (f) => fence('scss', f, await read(f))))).join('\n')

  const themeTsApi =
    '# 主题 TypeScript API（UITheme / loadTheme / helper）\n\n' +
    (await Promise.all(themeTsFiles.map(async (f) => fence('typescript', f, await read(f))))).join(
      '\n'
    )

  await writeFile(join(GENERATED_DIR, 'theme-tokens.md'), themeTokens + '\n', 'utf-8')
  await writeFile(join(GENERATED_DIR, 'scss-api.md'), scssApi + '\n', 'utf-8')
  await writeFile(join(GENERATED_DIR, 'theme-ts-api.md'), themeTsApi + '\n', 'utf-8')

  const manifest: Manifest = {
    syncedAt: new Date().toISOString(),
    outputs: {
      'theme-tokens.md': [...themeTokenFiles],
      'scss-api.md': [...scssFiles],
      'theme-ts-api.md': [...themeTsFiles]
    }
  }
  await writeFile(
    join(GENERATED_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  )

  console.log('[sync] done → generated/theme-tokens.md, scss-api.md, theme-ts-api.md')
}

main().catch((e: unknown) => {
  console.error('[sync] failed:', e)
  process.exit(1)
})
