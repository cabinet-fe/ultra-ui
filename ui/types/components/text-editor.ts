import type { DeconstructValue } from '../helper'

/** text-editor组件属性 */
export interface TextEditorProps {
  modelValue?: string
}

/** text-editor组件定义的事件 */
export interface TextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** text-editor组件暴露的属性和方法(组件内部使用) */
export interface _TextEditorExposed {}

/** text-editor组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextEditorExposed = DeconstructValue<_TextEditorExposed>
