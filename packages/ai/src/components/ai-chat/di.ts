import type { BEM } from '@veltra/utils'
import type { InjectionKey, Slots } from 'vue'

export interface AiChatContext {
  /** ai-chat 组件的 BEM 类生成器 */
  cls: BEM<'ai-chat'>
  /** ai-chat 使用方提供的插槽（用于 tool-<name> 动态插槽） */
  slots: Slots
}

export const AiChatDIKey: InjectionKey<AiChatContext> = Symbol('AiChatDIKey')
