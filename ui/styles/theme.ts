import { useConfig } from '@ui/compositions'
import type { UITheme } from './theme/ui-theme'
import { lightTheme } from './theme/light'
import { darkTheme } from './theme/dark'
import { shallowRef } from 'vue'

const { config } = useConfig()

export const currentTheme = shallowRef<UITheme>()
/**

 * @description 加载主题, 如果你是 SSR 环境,
 * 请在 `onMounted` 中调用，否则你可以在
 * 项目的入口环境(通常是main.ts文件中)或者其他全局
 * 环境中调用。
 */
export function loadTheme(theme?: UITheme) {
  currentTheme.value = theme ?? lightTheme

  currentTheme.value.render()

  document.documentElement.classList.add(config.size)
}

export type * from './type'
export { UITheme } from './theme/ui-theme'
export { lightTheme, darkTheme }
