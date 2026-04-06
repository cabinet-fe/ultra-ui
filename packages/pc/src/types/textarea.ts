import type { DeconstructValue } from '../helper'
import type { FormComponentProps } from '../component-common'

/** textarea组件属性 */
export interface TextareaProps extends FormComponentProps {
  /**
   * 文本域的值
   */
  modelValue?: string
  /**
   * 文本域的高度
   */
  height?: string
  /**
   * 文本域的占位符
   */
  placeholder?: string
  /**
   * 文本域是否禁用
   */
  disabled?: boolean
  /**
   * 文本域是否只读
   */
  readonly?: boolean

  /**
   * 是否能被缩放
   */
  resize?: boolean
  /**
   * 文本域的行数
   */
  rows?: number
  /**
   * 文本域的列数
   */
  cols?: number
  /**
   * 文本域的最大字数
   */
  maxlength?: number
  /**
   * 是否显示字符数
   */
  showCount?: boolean
  /**
   * 清空
   */
  clearable?: boolean

  /** 原生只读 */
  nativeReadonly?: boolean

  /**是否自适应大小 */
  autosize?: boolean
}

/** textarea组件定义的事件 */
export interface TextareaEmits {
  /**modelValue值改变时触发 */
  (e: 'update:modelValue', value: string): void
  /**当 modelValue 改变时，并且文本框失去焦点或用户按Enter时触发 */
  (e: 'change', value: string): void
  /**文本框获取焦点时触发 */
  (e: 'focus'): void
  /**文本框失去焦点时触发 */
  (e: 'blur'): void
  /**清空按钮时触发 */
  (e: 'clear'): void
}

/** textarea组件暴露的属性和方法(组件内部使用) */
export interface _TextareaExposed {}

/** textarea组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextareaExposed = DeconstructValue<_TextareaExposed>
