import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

export interface PaletteRGBA {
  r: number
  g: number
  b: number
  a: number
}

/** 调色盘组件属性 */
export interface PaletteProps extends FormComponentProps {
  modelValue?: string
}

/** 调色盘组件定义的事件 */
export interface PaletteEmits {
  (e: 'update:modelValue', value: string): void
}

/** 调色盘组件暴露的属性和方法(组件内部使用) */
export interface _PaletteExposed {}

/** 调色盘组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaletteExposed = DeconstructValue<_PaletteExposed>
