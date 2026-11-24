import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type RichTextFormat = 'html' | 'json'

/** 图片上传函数：接收文件，返回上传后的服务器地址 */
export type RichTextImageUploader = (file: File) => Promise<string>

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
  | 'image'
  | 'undo'
  | 'redo'
  | '|'

export interface RichTextEditorProps extends FormComponentProps {
  modelValue?: string
  format?: RichTextFormat
  toolbar?: ToolbarItem[]
  placeholder?: string
  /** 是否允许图片输入（粘贴 / 拖拽 / 工具栏），默认 true */
  image?: boolean
}

export interface RichTextEditorEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _RichTextEditorExposed {
  /**
   * 上传编辑器内所有待上传图片：对每张图片调用 upload 获取服务器地址并替换节点，
   * 返回替换后的最终内容（格式遵循 format 属性）。
   * 任一上传失败则整体拒绝，图片保持待上传状态可整体重试；已上传的不会重复上传
   */
  uploadImages: (upload: RichTextImageUploader) => Promise<string>
}

/** 富文本编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RichTextEditorExposed = DeconstructValue<_RichTextEditorExposed>
