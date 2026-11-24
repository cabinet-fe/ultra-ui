import type { UITheme } from '@veltra/styles/theme'
import type { DeconstructValue } from '@veltra/utils'

export interface ThemeProps {
  /** 指定要编辑的主题实例，默认跟随当前已加载主题 */
  theme?: UITheme
}

export interface _ThemeExposed {
  /** 恢复到当前基线主题 */
  reset: () => void
  exportTheme: () => void
  applyLightPreset: () => void
  applyDarkPreset: () => void
}

export type ThemeExposed = DeconstructValue<_ThemeExposed>
