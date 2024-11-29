import type { PaletteRGBA } from '@ui/types'
import type { BEM } from '@ui/utils'
import type { InjectionKey } from 'vue'

export const PaletteDIKey: InjectionKey<{
  cls: BEM<'palette', 'u-'>
  RGBA: PaletteRGBA
  updateRGB: (offsetX: number, offsetY: number) => void
  updateAlpha: (offsetX: number, offsetY: number) => void
}> = Symbol('PaletteDIKey')
