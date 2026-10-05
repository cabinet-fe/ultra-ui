import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 文本域组件属性（API 与 @veltra/desktop UTextarea 对齐；字号 16px、行高与内边距走移动端 token） */
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
   * 是否显示字符数统计（当前字数/最大字数，展示在文本域右下角）
   */
  showCount?: boolean
  /**
   * 清空
   */
  clearable?: boolean

  /** 原生只读 */
  nativeReadonly?: boolean

  /** 是否自适应大小 */
  autosize?: boolean
}

/** 文本域组件定义的事件 */
export interface TextareaEmits {
  /** modelValue值改变时触发 */
  (e: 'update:modelValue', value: string): void
  /** 当 modelValue 改变时，并且文本框失去焦点或用户按Enter时触发 */
  (e: 'change', value: string): void
  /** 文本框获取焦点时触发 */
  (e: 'focus'): void
  /** 文本框失去焦点时触发 */
  (e: 'blur'): void
  /** 清空按钮时触发 */
  (e: 'clear'): void
}

/** 文本域暴露的属性和方法(组件内部使用) */
export interface _TextareaExposed {}

/** 文本域暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextareaExposed = DeconstructValue<_TextareaExposed>
