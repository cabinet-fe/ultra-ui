import type { DeconstructValue } from '@veltra/utils'

export interface CheckTagProps {
  modelValue?: boolean

  checked?: boolean
}

export interface CheckTagEmits {
  (e: 'update:modelValue', value: boolean): void
}

export interface _CheckTagExposed {}

/** check-tag组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CheckTagExposed = DeconstructValue<_CheckTagExposed>
