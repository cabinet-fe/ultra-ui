import { useConfig } from '@ui/compositions'
import type { UITheme } from './theme/ui-theme'
import { lightTheme } from './theme/light'
import { darkTheme } from './theme/dark'
import { shallowRef, type ShallowRef } from 'vue'

export const currentTheme: ShallowRef<UITheme | undefined> =
  shallowRef<UITheme>()
/**

 * @description 加载主题, 如果你是 SSR 环境,
 * 请在 `onMounted` 中调用，否则你可以在
 * 项目的入口环境(通常是main.ts文件中)或者其他全局
 * 环境中调用。
 */
export function loadTheme(theme?: UITheme): void {
  currentTheme.value = theme ?? lightTheme

  currentTheme.value.render()

  const { config } = useConfig()
  if (typeof document === 'undefined') return
  document.documentElement.classList.add(config.size)
}

export type * from './type'
export { UITheme } from './theme/ui-theme'
export { lightTheme, darkTheme }
