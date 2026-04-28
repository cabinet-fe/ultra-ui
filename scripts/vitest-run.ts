#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const args = process.argv.slice(2)

const result = spawnSync('bunx', ['vitest', 'run', ...args], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  env: process.env
})

process.exit(result.status ?? 1)
