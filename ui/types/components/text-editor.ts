import type { DeconstructValue } from '../helper'
import type {
  BlockMutationEvent,
  API
} from '@editorjs/editorjs'

interface TextEditorBlocks {
  id?: string
  type: string
  data: Record<string, any>
}
export interface TextEditorOutputData {
  time?: number
  blocks: TextEditorBlocks[]
  version?: string
}

/** text-editor组件属性 */
export interface TextEditorProps {
  modelValue?: TextEditorOutputData
  /** 高度 */
  height?: string
  width?: string
  disabled?: boolean,
  placeholder?: string
}

/** text-editor组件定义的事件 */
export interface TextEditorEmits {
  (e: 'update:modelValue', value: TextEditorOutputData): void
  (
    e: 'change',
    value: TextEditorOutputData,
    api: API,
    event: BlockMutationEvent | BlockMutationEvent[]
  ): void
}

/** text-editor组件暴露的属性和方法(组件内部使用) */
export interface _TextEditorExposed {}

/** text-editor组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextEditorExposed = DeconstructValue<_TextEditorExposed>
