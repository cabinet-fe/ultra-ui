#!/usr/bin/env bun
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const config = resolve(repoRoot, 'vitest.config.ts')
const result = spawnSync('bunx', ['vitest', 'run', '--config', config, ...process.argv.slice(2)], {
  cwd: repoRoot,
  stdio: 'inherit'
})

process.exit(result.status ?? 1)
