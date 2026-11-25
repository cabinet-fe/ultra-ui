import type { ChatReasoningLevel } from '../providers'

export interface AiReasoningPickerProps {
  /** 可选推理等级列表 */
  levels: ChatReasoningLevel[]
  /** 当前选中的推理等级值，支持 v-model */
  modelValue?: string
  /** 未选择时的占位文案 */
  placeholder?: string
  /** 面板弹出方向 */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 面板对齐方式 */
  alignment?: 'center' | 'start' | 'end'
  /** 是否禁用 */
  disabled?: boolean
}

export interface AiReasoningPickerEmits {
  (e: 'update:modelValue', value: string | undefined): void
  /** 切换选中推理等级时触发 */
  (e: 'change', value: string, level: ChatReasoningLevel): void
}
