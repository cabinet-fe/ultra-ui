import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** UI路径 */
export const UI_PATH = fileURLToPath(new URL('../ui', import.meta.url))

/** 组件根目录 */
export const COMPONENT_PATH = join(UI_PATH, 'components')


