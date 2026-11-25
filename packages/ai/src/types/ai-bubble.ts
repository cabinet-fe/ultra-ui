import type { ChatMessage } from '../chat/types'

export interface AiBubbleProps {
  /** 待渲染的消息对象 */
  message: ChatMessage
  /** 是否为最后一条可见消息 */
  isLast?: boolean
  /** 是否展示操作区 */
  showActions?: boolean
  /** 是否展示重新生成按钮 */
  showRegenerate?: boolean
  /** 本轮总用时（ms） */
  duration?: number
  /** 透传给 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}

export interface AiBubbleEmits {
  /** 重新生成回复 */
  (e: 'regenerate'): void
  /** 复制消息正文 */
  (e: 'copy', content: string): void
  /** 点击附件或正文中的图片预览 */
  (e: 'preview-image', src: string, alt?: string): void
}
