import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface BarType {
  content: string
  bar: string
}

export interface TextEditorProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  toolbar?: BarType[]
}

export interface TextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _TextEditorExposed {}

/** text-editor组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextEditorExposed = DeconstructValue<_TextEditorExposed>
