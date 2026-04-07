import type { UITheme } from '@ultra-ui/utils/styles/theme'
import {
  currentTheme,
  darkTheme,
  lightTheme
} from '@ultra-ui/utils/styles/theme'
import { useConfig } from './use-config'

/**
 * @description 加载主题, 如果你是 SSR 环境,
 * 请在 `onMounted` 中调用，否则你可以在
 * 项目的入口环境(通常是 main.ts)或其他全局环境中调用。
 */
export function loadTheme(theme?: UITheme): void {
  currentTheme.value = theme ?? lightTheme

  currentTheme.value.render()

  const { config } = useConfig()
  if (typeof document === 'undefined') return
  document.documentElement.classList.add(config.size)
}

export { darkTheme, lightTheme }
