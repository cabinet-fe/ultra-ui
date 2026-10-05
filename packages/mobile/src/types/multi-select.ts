import type { FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

/** multi-select 组件属性（移动端形态：面板走 BottomSheet） */
export interface MultiSelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: Array<any>
  /** 列表选项 */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否启用搜索功能 */
  filterable?: boolean
  /** 最大展示数量 */
  visibilityLimit?: number
  /** 最大可选数量 */
  max?: number
  /** 底部面板内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 底部面板内容容器类名 */
  contentClass?: unknown
  /** 是否允许创建新选项 */
  creatable?: boolean
}

/** multi-select 组件定义的事件 */
export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<any>): void
  (e: 'change', options: Record<string, any>[]): void
}
