import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

/** multi-select组件属性 */
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
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
  /** 弹框最小宽度 */
  minWidth?: string
  /**
   * 弹框宽度
   * @default '220px'
   */
  width?: string
  /** 是否允许创建新选项 */
  creatable?: boolean
}

/** multi-select组件定义的事件 */
export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<any>): void
  (e: 'change', options: Record<string, any>[]): void
}

/** multi-select组件暴露的属性和方法(组件内部使用) */
export interface _MultiSelectExposed {}

/** multi-select组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiSelectExposed = DeconstructValue<_MultiSelectExposed>
