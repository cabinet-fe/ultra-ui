import type { ChatAttachment } from '../chat/types'

/** 附件列表展示尺寸 */
export type AiAttachmentsSize = 'compact' | 'default'

export interface AiAttachmentsProps {
  /** 附件列表 */
  items: ChatAttachment[]
  /** 是否允许移除附件 */
  removable?: boolean
  /** 展示尺寸，默认 'default' */
  size?: AiAttachmentsSize
}

export interface AiAttachmentsEmits {
  /** 移除指定附件 */
  (e: 'remove', index: number, item: ChatAttachment): void
  /** 点击预览附件 */
  (e: 'preview', item: ChatAttachment, index: number): void
}
