import type { DeconstructValue } from '@veltra/utils'

import type { InputProps } from './input'

/** 密码输入组件属性（API 与 @veltra/desktop UPasswordInput 对齐；明文切换按钮 44px 触控热区为移动端形态） */
export interface PasswordInputProps extends InputProps {
  modelValue?: string
}

export interface PasswordInputEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _PasswordInputExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type PasswordInputExposed = DeconstructValue<_PasswordInputExposed>
