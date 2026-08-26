import { useConfig } from '@veltra/compositions'
import { shallowRef, type ShallowRef } from 'vue'

import { lightTheme } from './presets'
import type { UITheme } from './ui-theme'

export const currentTheme: ShallowRef<UITheme | undefined> = shallowRef<UITheme>()

const SIZES = ['small', 'default', 'large'] as const

/**
 * @description 加载主题, 如果你是 SSR 环境,
 * 请在 `onMounted` 中调用，否则你可以在
 * 项目的入口环境(通常是 main.ts)或其他全局环境中调用。
 *
 * 主题自带系列（`theme.series`），应用时会注入全局 token 与
 * 同系列的组件级 token，并把 `html[data-theme]` 置为对应系列。
 */
export function loadTheme(theme: UITheme = lightTheme): void {
  currentTheme.value = theme

  if (typeof document === 'undefined') return

  const { config } = useConfig()
  const classList = document.documentElement.classList
  classList.remove(...SIZES.filter((s) => s !== config.size))
  classList.add(config.size)

  theme.render()
}
