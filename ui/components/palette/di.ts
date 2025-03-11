import type { PaletteRGB } from '@ui/types'
import type { BEM } from '@ui/utils'
import type { InjectionKey, Ref } from 'vue'

export const PaletteDIKey: InjectionKey<{
  cls: BEM<'palette', 'u-'>
  /** 最终的颜色 */
  RGB: PaletteRGB
  /** 调色滑块的颜色 */
  hue: PaletteRGB
  /** 饱和度 亮度 */
  sv: { s: number; v: number }
  /** 透明度 */
  alpha: Ref<number>
  /** 更新色调 */
  updateHue: (index: number, rate: number) => void
  /** 更新调色盘透明度 */
  updateAlpha: (offsetX: number, offsetY: number) => void
  /** 更新饱和度 亮度 */
  updateSV: (sv: { s?: number; v?: number }) => void
}> = Symbol('PaletteDIKey')
