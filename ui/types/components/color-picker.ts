import type { DeconstructValue } from '../helper'

/** 拾色器组件属性 */
export interface ColorPickerProps {
  modelValue?: string
}

/** 拾色器组件定义的事件 */
export interface ColorPickerEmits {
  (e: 'update:modelValue', value: string): void
}

/** 拾色器组件暴露的属性和方法(组件内部使用) */
export interface _ColorPickerExposed {}

/** 拾色器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ColorPickerExposed = DeconstructValue<_ColorPickerExposed>
