import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'
import type { ShallowRef } from 'vue'

/** 输入框组件属性 */
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
  /** 原生只读 */
  nativeReadonly?: boolean
}

export interface InputEmits {
  /** 输入时持续更新 */
  (e: 'update:modelValue', value: string): void
  /** 在输入框失焦时触发更新 */
  (e: 'change', value: string): void
  /** 后缀点击事件 */
  (e: 'suffix:click', value?: string): void
  /** 前缀点击事件 */
  (e: 'prefix:click', value?: string): void
  /** 聚焦事件 */
  (e: 'focus', value?: string): void
  /** 清除事件 */
  (e: 'clear'): void
  /** 失焦事件 */
  (e: 'blur', value?: string): void
  /** 原生输入事件 */
  (e: 'native:input', ev: Event): void
}

export interface _InputExposed {
  el: ShallowRef<HTMLInputElement | undefined>
}

export type InputExposed = DeconstructValue<_InputExposed>
