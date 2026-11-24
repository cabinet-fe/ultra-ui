import type { FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

/** multi-select 组件属性（移动端形态：面板走 BottomSheet） */
export interface MultiSelectProps extends FormComponentProps {
  modelValue?: Array<any>
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  valueKey?: string
  labelKey?: string
  clearable?: boolean
  placeholder?: string
  filterable?: boolean
  visibilityLimit?: number
  max?: number
  contentStyle?: CSSProperties | string
  contentClass?: unknown
  creatable?: boolean
}

export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<any>): void
  (e: 'change', options: Record<string, any>[]): void
}
