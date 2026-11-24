import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export type SegmentItem = Record<string, any>

export interface SegmentProps extends FormComponentProps {
  modelValue?: any
  items: SegmentItem[]
  /**
   * @default 'value'
   */
  valueKey?: string
  /**
   * @default 'label'
   */
  labelKey?: string
  /** 是否禁用整组 */
  disabled?: boolean
  disabledItem?: (item: SegmentItem) => boolean
  block?: boolean
}

export interface SegmentEmits {
  (e: 'update:modelValue', modelValue: any): void
  (e: 'change', item: SegmentItem): void
}

export interface _SegmentExposed {}

/** 分段单选组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SegmentExposed = DeconstructValue<_SegmentExposed>
