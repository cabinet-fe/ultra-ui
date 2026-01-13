import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const ROOT = resolve(__dirname, '..')

export const UI_ROOT = resolve(ROOT, 'ui')

export const DIST_ROOT = resolve(ROOT, 'dist')