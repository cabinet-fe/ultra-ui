import type { DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

import type { ChatAttachment } from '../chat/types'

/** 上下文拾取器选项 */
export interface AiContextPickerItem {
  /** 选项唯一标识 */
  key: string
  /** 显示名称 */
  label: string
  /** 选项图标组件 */
  icon?: Component
  /** 选项补充说明 */
  description?: string
  /** 是否禁用 */
  disabled?: boolean
}

export interface AiContextPickerProps {
  /** 自定义扩展上下文选项 */
  items?: AiContextPickerItem[]
  /** 是否显示本地文件上传入口 */
  upload?: boolean
  /** 上传入口文案 */
  uploadLabel?: string
  /** 文件选择 accept 过滤 */
  accept?: string
  /** 是否允许选择多个文件 */
  multiple?: boolean
  /** 单个附件最大字节数 */
  maxAttachmentSize?: number
  /** 弹出方向 */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 对齐方式 */
  alignment?: 'center' | 'start' | 'end'
  /** 是否禁用 */
  disabled?: boolean
}

export interface AiContextPickerEmits {
  /** 选择本地文件后触发（原始 File 列表） */
  (e: 'pick-files', files: File[]): void
  /** 读取并转换为 ChatAttachment 后触发 */
  (e: 'add-attachments', attachments: ChatAttachment[]): void
  /** 选中自定义上下文选项时触发 */
  (e: 'select', item: AiContextPickerItem): void
}

export interface _AiContextPickerExposed {
  /** 关闭下拉面板 */
  close: () => void
}

export type AiContextPickerExposed = DeconstructValue<_AiContextPickerExposed>
