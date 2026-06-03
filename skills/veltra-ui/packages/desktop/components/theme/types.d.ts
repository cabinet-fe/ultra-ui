import type { UITheme } from '@veltra/styles/theme'
import type { DeconstructValue } from '@veltra/utils'

/** 主题组件属性 */
export interface ThemeProps {
  /** 指定要编辑的主题实例，默认跟随当前已加载主题 */
  theme?: UITheme
}

/** 主题组件暴露的属性和方法(组件内部使用) */
export interface _ThemeExposed {
  /** 恢复到当前基线主题 */
  reset: () => void
  /** 导出当前主题 */
  exportTheme: () => void
  /** 应用浅色预设 */
  applyLightPreset: () => void
  /** 应用深色预设 */
  applyDarkPreset: () => void
}

/** 主题组件暴露的属性和方法 */
export type ThemeExposed = DeconstructValue<_ThemeExposed>
