import {
  currentTheme,
  darkTheme,
  lightTheme,
  UITheme,
  setTheme
} from '@ultra-ui/utils/styles/theme'
import { useConfig } from './use-config'

/**
 * @description 加载主题, 如果你是 SSR 环境,
 * 请在 `onMounted` 中调用，否则你可以在
 * 项目的入口环境(通常是 main.ts)或其他全局环境中调用。
 *
 * 不传 `theme` 时注入内置 light/dark 变量（支持 `setTheme` 与系统暗色偏好）。
 * 传入自定义 `UITheme` 时使用单次 `html { }` 注入。
 */
export function loadTheme(theme?: UITheme): void {
  currentTheme.value = theme ?? lightTheme

  const { config } = useConfig()
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add(config.size)
  }

  if (typeof document === 'undefined') return

  if (!theme) {
    currentTheme.value = lightTheme
    UITheme.injectBuiltInThemes(lightTheme, darkTheme)
    return
  }

  currentTheme.value = theme

  if (theme === lightTheme || theme === darkTheme) {
    UITheme.injectBuiltInThemes(lightTheme, darkTheme)
    UITheme.setTheme(theme === darkTheme ? 'dark' : 'light')
  } else {
    theme.render()
  }
}

export { darkTheme, lightTheme, setTheme }
