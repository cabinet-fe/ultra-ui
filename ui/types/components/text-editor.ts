import type { DeconstructValue } from '../helper'
import type { Delta, Op } from 'quill/core'
/** text-editor组件属性 */
interface BarType {
  content: string
  bar: string
}

export interface TextEditorProps {
  modelValue?: Delta | Op[]
  /** 高度 */
  height?: string
  width?: string
  disabled?: boolean
  placeholder?: string
  toolbar?: BarType[]
}

/** text-editor组件定义的事件 */
export interface TextEditorEmits {
  (e: 'update:modelValue', value: any): void
}

/** text-editor组件暴露的属性和方法(组件内部使用) */
export interface _TextEditorExposed {}

/** text-editor组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextEditorExposed = DeconstructValue<_TextEditorExposed>
