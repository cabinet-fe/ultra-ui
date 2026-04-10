import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = spawnSync('bunx', ['vitest', '--run'], { cwd: root, stdio: 'inherit' })
process.exit(r.status ?? 0)
