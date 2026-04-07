import type { DeconstructValue } from '../helper'

/** check-tag组件属性 */
export interface CheckTagProps {
  modelValue?: string

  checked?: boolean
}

/** check-tag组件定义的事件 */
export interface CheckTagEmits {
  (e: 'update:modelValue', value: boolean): void
}

/** check-tag组件暴露的属性和方法(组件内部使用) */
export interface _CheckTagExposed {}

/** check-tag组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CheckTagExposed = DeconstructValue<_CheckTagExposed>
