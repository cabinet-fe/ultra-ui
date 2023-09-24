import type { FormComponentProps } from '@ui/shared'
import type { DeconstructValue } from '@ui/utils'
import type { ShallowRef } from 'vue'

/** 输入框组件组件属性 */
export interface InputProps extends FormComponentProps {
  /** modelValue */
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 前缀 */
  prefix?: string
  /** 后缀 */
  suffix?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 密码 */
  password?: boolean
}

export interface InputEmits {
  /** 输入时持续更新 */
  (e: 'update:modelValue', value: string): void
  /** 在输入框失焦时触发更新 */
  (e: 'change', value: string): void
  (e: 'suffix:click', value?: string): void
  (e: 'prefix:click', value?: string): void
  (e: 'focus', value?: string): void
  (e: 'blur', value?: string): void
}

export interface _InputExposed {
  el: ShallowRef<HTMLInputElement | undefined>
}

export type InputExposed = DeconstructValue<_InputExposed>
