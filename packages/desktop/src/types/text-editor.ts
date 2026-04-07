import type { FormComponentProps } from '@ultra-ui/utils/types/component-common'
import type { DeconstructValue } from '@ultra-ui/utils/types/helper'

/** text-editor组件属性 */
export interface BarType {
  content: string
  bar: string
}

export interface TextEditorProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  toolbar?: BarType[]
}

/** text-editor组件定义的事件 */
export interface TextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** text-editor组件暴露的属性和方法(组件内部使用) */
export interface _TextEditorExposed {}

/** text-editor组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextEditorExposed = DeconstructValue<_TextEditorExposed>
