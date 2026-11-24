import type { DeconstructValue } from '@veltra/utils'

export interface CheckTagProps {
  modelValue?: boolean

  checked?: boolean

  /** 是否禁用；禁用后点击不切换选中态、不触发任何事件 */
  disabled?: boolean
}

export interface CheckTagEmits {
  (e: 'update:modelValue', value: boolean): void

  (e: 'change', value: boolean): void
}

export interface _CheckTagExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type CheckTagExposed = DeconstructValue<_CheckTagExposed>
