import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** UI（PC 包）源码根路径 */
export const UI_PATH = fileURLToPath(new URL('../packages/pc/src', import.meta.url))

/** 组件根目录 */
export const COMPONENT_PATH = join(UI_PATH, 'components')
