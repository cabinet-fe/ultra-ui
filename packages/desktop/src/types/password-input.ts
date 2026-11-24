import type { DeconstructValue } from '@veltra/utils'

import type { InputProps } from './input'

export interface PasswordInputProps extends InputProps {
  modelValue?: string
}

export interface PasswordInputEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _PasswordInputExposed {}

/** 密码输入组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PasswordInputExposed = DeconstructValue<_PasswordInputExposed>
