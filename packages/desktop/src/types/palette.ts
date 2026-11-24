import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface PaletteRGB {
  r: number
  g: number
  b: number
}

export interface PaletteHSV {
  h: number
  s: number
  v: number
}

export type PaletteColorType = 'HEX' | 'RGB'

export interface PaletteProps extends FormComponentProps {
  modelValue?: string
  disabled?: boolean
  readonly?: boolean
}

export interface PaletteEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _PaletteExposed {}

/** 调色盘组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaletteExposed = DeconstructValue<_PaletteExposed>
