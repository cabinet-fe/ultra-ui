import type { FormComponentProps } from '@ui/shared'

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 是否多选 */
  multiple?: boolean
}

export interface SelectEmits {
  /** 触发更新label事件 */
  (e: 'update:label', label?: string): void
}
