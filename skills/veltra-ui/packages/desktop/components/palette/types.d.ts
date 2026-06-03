import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 色调 */
export interface PaletteRGB {
  r: number
  g: number
  b: number
}

/** 饱和度 亮度 */
export interface PaletteHSV {
  h: number
  s: number
  v: number
}

/** 调色盘组件颜色类型 */
export type PaletteColorType = 'HEX' | 'RGB'

/** 调色盘组件属性 */
export interface PaletteProps extends FormComponentProps {
  modelValue?: string
  disabled?: boolean
  readonly?: boolean
}

/** 调色盘组件定义的事件 */
export interface PaletteEmits {
  (e: 'update:modelValue', value: string): void
}

/** 调色盘组件暴露的属性和方法(组件内部使用) */
export interface _PaletteExposed {}

/** 调色盘组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaletteExposed = DeconstructValue<_PaletteExposed>
