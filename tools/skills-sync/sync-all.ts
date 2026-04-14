#!/usr/bin/env bun
/**
 * 依次执行全部 veltra 技能同步脚本（不含 use-cat-kit，除非传入 --with-cat-kit）。
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(dir, '../..')

const VELTRA = [
  'sync-veltra-desktop.ts',
  'sync-veltra-compositions.ts',
  'sync-veltra-utils.ts',
  'sync-veltra-styles.ts',
  'sync-veltra-directives.ts'
] as const

async function run(script: string): Promise<void> {
  const proc = Bun.spawnSync(['bun', join(dir, script)], {
    cwd: repoRoot,
    stdout: 'inherit',
    stderr: 'inherit'
  })
  if (proc.exitCode !== 0) {
    throw new Error(`${script} exited with ${proc.exitCode}`)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  for (const s of VELTRA) {
    await run(s)
  }
  if (args.includes('--with-cat-kit')) {
    const catKitScript = join(repoRoot, '.agents/skills/use-cat-kit/scripts/sync-api-from-dist.ts')
    const proc = Bun.spawnSync(['bun', catKitScript], {
      cwd: repoRoot,
      stdout: 'inherit',
      stderr: 'inherit'
    })
    if (proc.exitCode !== 0) {
      throw new Error(`use-cat-kit sync exited with ${proc.exitCode}`)
    }
  }
  console.log('[sync-all] veltra skills done.')
}

main().catch((e: unknown) => {
  console.error('[sync-all] failed:', e)
  process.exit(1)
})
