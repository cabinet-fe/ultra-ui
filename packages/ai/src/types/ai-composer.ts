import type { DeconstructValue } from '@veltra/utils'

import type { ChatAttachment } from '../chat/types'

export interface AiComposerProps {
  /** 输入框文本，支持 v-model */
  modelValue?: string
  /** 待发送附件列表，支持 v-model:attachments */
  attachments?: ChatAttachment[]
  /** 是否处于生成中状态（空输入时显示停止按钮，有内容则发送入队） */
  running?: boolean
  /** 空闲态占位文案 */
  placeholder?: string
  /** 生成中占位文案 */
  runningPlaceholder?: string
  /** 是否禁用输入 */
  disabled?: boolean
  /** 单个附件最大字节数 */
  maxAttachmentSize?: number
  /** 是否允许从剪贴板粘贴图片 */
  allowPasteImage?: boolean
  /** 输入框自适应最大高度（px） */
  maxHeight?: number
}

export interface AiComposerEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:attachments', attachments: ChatAttachment[]): void
  /** 提交发送内容与附件 */
  (e: 'send', content: string, attachments: ChatAttachment[]): void
  /** 点击停止按钮中断生成 */
  (e: 'abort'): void
  /** 点击附件图片预览 */
  (e: 'preview-image', src: string, alt?: string): void
}

export interface _AiComposerExposed {
  /** 设置输入框内容 */
  setContent: (content: string) => void
  /** 获取当前输入框内容 */
  getContent: () => string
  /** 聚焦输入框 */
  focus: () => void
  /** 追加已解析的附件列表 */
  addAttachments: (items: ChatAttachment[]) => void
  /** 解析并追加本地文件 */
  addFiles: (files: File[]) => Promise<void>
}

export type AiComposerExposed = DeconstructValue<_AiComposerExposed>
