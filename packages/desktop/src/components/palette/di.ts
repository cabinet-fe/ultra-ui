import type { UserAction } from '@veltra/compositions'
import type { BEM } from '@veltra/utils'
import type { InjectionKey, Ref, ComputedRef } from 'vue'

import type { PaletteHSV, PaletteRGB } from '../../types'

export const PaletteDIKey: InjectionKey<{
  cls: BEM<'palette', 'u-'>
  hueRGB: ComputedRef<PaletteRGB>
  HSV: PaletteHSV
  RGB: ComputedRef<PaletteRGB>
  alpha: Ref<number>
  /** 将函数包装为用户动作（阻断 modelValue 回流副作用） */
  userAction: UserAction
  isUserActive: () => boolean
  updateHue: (deg: number) => void
  updateAlpha: (alpha: number) => void
  updateSV: (sv: { s: number; v: number }) => void
}> = Symbol('PaletteDIKey')
