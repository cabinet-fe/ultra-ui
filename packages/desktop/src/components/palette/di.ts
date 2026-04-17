import type { UserAction } from '@veltra/compositions'
import type { BEM } from '@veltra/utils'
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
  /** 将函数包装为用户动作（阻断 modelValue 回流副作用） */
  userAction: UserAction
  /** 当前是否处于用户动作期间 */
  isUserActive: () => boolean
  /** 更新色调 */
  updateHue: (deg: number) => void
  /** 更新调色盘透明度 */
  updateAlpha: (alpha: number) => void
  /** 更新饱和度 亮度 */
  updateSV: (sv: { s: number; v: number }) => void
}> = Symbol('PaletteDIKey')
