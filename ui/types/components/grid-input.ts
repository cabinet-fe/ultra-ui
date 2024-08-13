import type { DeconstructValue } from '../helper'

/** 密码输入框组件组件属性 */
export interface GridInputProps {
  modelValue?: string
  length?: number
  zero?: false
  separator?: string
}

/** 密码输入框组件组件定义的事件 */
export interface GridInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
}

/** 密码输入框组件组件暴露的属性和方法(组件内部使用) */
export interface _GridInputExposed {
  clear: () => void
}

/** 密码输入框组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GridInputExposed = DeconstructValue<_GridInputExposed>
