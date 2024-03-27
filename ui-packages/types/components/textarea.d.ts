import type {DeconstructValue} from "../helper"
import type {FormComponentProps} from "../component-common"

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
   * 是否自动调整文本域的大小
   */
  autosize?: boolean
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
}

/** textarea组件定义的事件 */
export interface TextareaEmits {
  (e: "update:modelValue", value: string): void
  (e: "change", value: string): void
  (e: "focus"): void
  (e: "blur"): void
  (e: "clear"): void
}

/** textarea组件暴露的属性和方法(组件内部使用) */
export interface _TextareaExposed {}

/** textarea组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextareaExposed = DeconstructValue<_TextareaExposed>
