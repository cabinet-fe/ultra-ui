import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 富文本数据格式 */
export type RichTextFormat = 'html' | 'json'

/** 工具栏项 */
export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'heading'
  | 'bullet-list'
  | 'ordered-list'
  | 'blockquote'
  | 'code-block'
  | 'link'
  | 'undo'
  | 'redo'
  | '|'

/** 富文本编辑器组件属性 */
export interface RichTextEditorProps extends FormComponentProps {
  modelValue?: string
  /** 数据格式：html 或 json */
  format?: RichTextFormat
  /** 工具栏配置 */
  toolbar?: ToolbarItem[]
  /** 占位文本 */
  placeholder?: string
}

/** 富文本编辑器组件定义的事件 */
export interface RichTextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 富文本编辑器组件暴露的属性和方法(组件内部使用) */
export interface _RichTextEditorExposed {}

/** 富文本编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RichTextEditorExposed = DeconstructValue<_RichTextEditorExposed>
