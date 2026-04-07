import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const ROOT = resolve(__dirname, '../..')

export const PACKAGES = resolve(ROOT, 'packages')

/** 发布用包根（含 package.json） */
export const DESKTOP_PKG = resolve(PACKAGES, 'desktop')

/** 组件库源码根 */
export const DESKTOP_SRC = resolve(DESKTOP_PKG, 'src')

export const UTILS_SRC = resolve(PACKAGES, 'utils/src')

export const COMPOSITIONS_SRC = resolve(PACKAGES, 'compositions/src')

export const DIRECTIVES_SRC = resolve(PACKAGES, 'directives/src')

/** @deprecated 使用 DESKTOP_SRC；保留别名以免漏改引用 */
export const UI_ROOT = DESKTOP_SRC

export const DIST_ROOT = resolve(ROOT, 'dist')

export const workspaceTsAliases = {
  'ultra-ui': DESKTOP_SRC,
  '@ultra-ui/utils': UTILS_SRC,
  '@ultra-ui/compositions': COMPOSITIONS_SRC,
  '@ultra-ui/directives': DIRECTIVES_SRC,
  '@ultra-ui/desktop/types': resolve(DESKTOP_SRC, 'types'),
  '@ultra-ui/desktop/components': resolve(DESKTOP_SRC, 'components'),
  '@ultra-ui/desktop': DESKTOP_SRC
} as const
