import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Desktop 包源码根路径 */
export const UI_PATH = fileURLToPath(
  new URL('../../packages/desktop/src', import.meta.url)
)

/** 组件根目录 */
export const COMPONENT_PATH = join(UI_PATH, 'components')
