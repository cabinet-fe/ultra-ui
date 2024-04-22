import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** UI包目录 */
export const PKG_PATH = fileURLToPath(new URL('../ui-packages', import.meta.url))

/** 组件根目录 */
export const COMPONENT_PATH = join(PKG_PATH, 'components')

/** UI路径 */
export const UI_PATH = fileURLToPath(new URL('../ui', import.meta.url))