import { fileURLToPath } from "node:url"

/** 组件根目录 */
export const UI_PATH = fileURLToPath(new URL('../ui-packages/components', import.meta.url))
