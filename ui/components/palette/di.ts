import type { PaletteHSV, PaletteRGB } from '@ui/types'
import type { BEM } from '@ui/utils'
import type { InjectionKey, Ref, ComputedRef } from 'vue'

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
  /** 更新色调 */
  updateHue: (deg: number) => void
  /** 更新调色盘透明度 */
  updateAlpha: (offsetX: number, offsetY: number) => void
  /** 更新饱和度 亮度 */
  updateSV: (sv: { s: number; v: number }) => void
}> = Symbol('PaletteDIKey')
