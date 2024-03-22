import type { DeconstructValue } from '../helper'

/** 密码输入组件属性 */
export interface PasswordInputProps {
  modelValue?: string
}

/** 密码输入组件定义的事件 */
export interface PasswordInputEmits {
  (e: 'update:modelValue', value: string): void
}

/** 密码输入组件暴露的属性和方法(组件内部使用) */
export interface _PasswordInputExposed {}

/** 密码输入组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PasswordInputExposed = DeconstructValue<_PasswordInputExposed>
