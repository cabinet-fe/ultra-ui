import type { Updater } from '@ultra-ui/compositions'
import type { BEM } from '@ultra-ui/utils'
import type { InjectionKey, Ref, ComputedRef } from 'vue'

import type { PaletteHSV, PaletteRGB } from '../../types'

export const PaletteDIKey: InjectionKey<{
  cls: BEM<'palette', 'u-'>
  /** 色调 RGB 值 */
  hueRGB: ComputedRef<PaletteRGB>
  /** 色调 饱和度 亮度 */
  HSV: PaletteHSV
  /** RGB 值 */
  RGB: ComputedRef<PaletteRGB>
  /** 透明度 */
  alpha: Ref<number>
  /** 更新器 */
  updater: Updater
  /** 更新色调 */
  updateHue: (deg: number) => void
  /** 更新调色盘透明度 */
  updateAlpha: (alpha: number) => void
  /** 更新饱和度 亮度 */
  updateSV: (sv: { s: number; v: number }) => void
}> = Symbol('PaletteDIKey')
