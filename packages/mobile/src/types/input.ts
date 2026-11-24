import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { ShallowRef } from 'vue'

/** 输入框组件属性（API 与 @veltra/desktop UInput 对齐；字号 16px、44px 触控热区为移动端形态） */
export interface InputProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  prefix?: string
  suffix?: string
  /** 是否可清除（移动端有值即展示清除按钮，不依赖 hover），默认 true */
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

/** 组件外部使用, 引用的值会被自动解构 */
export type InputExposed = DeconstructValue<_InputExposed>
