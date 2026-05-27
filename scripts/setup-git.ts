#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function git(args: readonly string[]) {
  return spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' })
}

function main() {
  if (!existsSync(join(REPO_ROOT, '.git'))) {
    return
  }

  const current = git(['config', '--local', '--get', 'core.ignorecase'])
  if (current.status === 0 && current.stdout.trim() === 'false') {
    return
  }

  const result = git(['config', '--local', 'core.ignorecase', 'false'])
  if (result.status !== 0) {
    console.warn('[setup-git] 无法设置 core.ignorecase=false:', result.stderr.trim())
    return
  }

  if (current.status === 0 && current.stdout.trim() === 'true') {
    console.log('[setup-git] 已将 core.ignorecase 设为 false（路径大小写敏感）')
  }
}

main()
