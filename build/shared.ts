import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const ROOT = resolve(__dirname, '..')

export const CORE_ROOT = resolve(ROOT, 'packages/core')
export const STYLES_ROOT = resolve(ROOT, 'packages/styles')
export const DIRECTIVES_ROOT = resolve(ROOT, 'packages/directives')
export const PC_ROOT = resolve(ROOT, 'packages/pc')

export const CORE_SRC = resolve(CORE_ROOT, 'src')
export const STYLES_SRC = resolve(STYLES_ROOT, 'src')
export const DIRECTIVES_SRC = resolve(DIRECTIVES_ROOT, 'src')
export const PC_SRC = resolve(PC_ROOT, 'src')

/** @deprecated 使用 PC_ROOT */
export const UI_ROOT = PC_ROOT

export const workspaceAliases = {
  '@ultra-ui/core': CORE_SRC,
  '@ultra-ui/styles': STYLES_SRC,
  '@ultra-ui/directives': DIRECTIVES_SRC,
  '@ultra-ui/pc': PC_SRC
} as const

export const PUBLISH_PACKAGES = [
  { name: '@ultra-ui/core', root: CORE_ROOT },
  { name: '@ultra-ui/styles', root: STYLES_ROOT },
  { name: '@ultra-ui/directives', root: DIRECTIVES_ROOT },
  { name: '@ultra-ui/pc', root: PC_ROOT }
] as const
