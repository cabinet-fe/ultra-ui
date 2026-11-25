import type { ChatModel } from '../providers'

export interface AiModelPickerProps {
  /** 可选模型列表（ChatModelOption 结构兼容 ChatModel） */
  models: ChatModel[]
  /** 当前选中的模型 id，支持 v-model */
  modelValue?: string
  /** 未选择模型时的占位文案 */
  placeholder?: string
  /** 面板弹出方向 */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 面板对齐方式 */
  alignment?: 'center' | 'start' | 'end'
  /** 是否禁用 */
  disabled?: boolean
}

export interface AiModelPickerEmits {
  (e: 'update:modelValue', value: string | undefined): void
  /** 切换选中模型时触发 */
  (e: 'change', value: string, model: ChatModel): void
}
