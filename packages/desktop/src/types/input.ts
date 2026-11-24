import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { ShallowRef } from 'vue'

export interface InputProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  prefix?: string
  suffix?: string
  clearable?: boolean
  nativeReadonly?: boolean
  /**
   * 模式
   * @description 如果指定请保证有一个符合模式的默认值
   */
  pattern?: RegExp
}

export interface InputEmits {
  (e: 'update:modelValue', value: string): void
  /** 在输入框失焦时触发更新 */
  (e: 'change', value: string): void
  (e: 'suffix:click', value?: string): void
  (e: 'prefix:click', value?: string): void
  (e: 'focus', value?: string): void
  (e: 'clear'): void
  (e: 'blur', value?: string): void
  (e: 'native:input', ev: Event): void
}

export interface _InputExposed {
  el: ShallowRef<HTMLInputElement | undefined>
}

export type InputExposed = DeconstructValue<_InputExposed>
