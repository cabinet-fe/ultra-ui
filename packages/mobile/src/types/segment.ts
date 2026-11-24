import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type SegmentItem = Record<string, any>

export interface SegmentProps extends FormComponentProps {
  modelValue?: any
  items: SegmentItem[]
  /**
   * 选项值 key
   * @default 'value'
   */
  valueKey?: string
  /**
   * 选项标签 key
   * @default 'label'
   */
  labelKey?: string
  disabled?: boolean
  disabledItem?: (item: SegmentItem) => boolean
  block?: boolean
}

export interface SegmentEmits {
  (e: 'update:modelValue', modelValue: any): void
  (e: 'change', item: SegmentItem): void
}

export interface _SegmentExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type SegmentExposed = DeconstructValue<_SegmentExposed>
