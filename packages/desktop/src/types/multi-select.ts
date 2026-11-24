import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

export interface MultiSelectProps extends FormComponentProps {
  modelValue?: Array<any>
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  valueKey?: string
  labelKey?: string
  /**
   * 标签展示模板
   * @description `{fieldKey}` 占位符按选项行字段插值（支持嵌套路径取值），
   * 模板引用的字段在行中取不到时整体回退 `row[labelKey]`；
   * 配置后下拉选项、已选标签等展示文案统一渲染模板结果
   * @example '{label}（{code}）'
   */
  labelTemplate?: string
  clearable?: boolean
  placeholder?: string
  filterable?: boolean
  visibilityLimit?: number
  max?: number
  contentStyle?: CSSProperties | string
  contentClass?: unknown
  minWidth?: string
  /**
   * @default '220px'
   */
  width?: string
  creatable?: boolean
}

export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<any>): void
  (e: 'change', options: Record<string, any>[]): void
}

export interface _MultiSelectExposed {}

/** multi-select组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiSelectExposed = DeconstructValue<_MultiSelectExposed>
