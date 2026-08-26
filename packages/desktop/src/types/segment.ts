import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 分段单选选项 */
export type SegmentItem = Record<string, any>

/** 分段单选组件属性 */
export interface SegmentProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: any
  /** 选项列表 */
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
  /** 是否禁用整组 */
  disabled?: boolean
  /** 禁用的选项判断函数 */
  disabledItem?: (item: SegmentItem) => boolean
  /** 是否撑满容器宽度 */
  block?: boolean
}

/** 分段单选组件事件 */
export interface SegmentEmits {
  /** 绑定值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选中项切换事件 */
  (e: 'change', item: SegmentItem): void
}

/** 分段单选组件暴露的属性和方法(组件内部使用) */
export interface _SegmentExposed {}

/** 分段单选组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SegmentExposed = DeconstructValue<_SegmentExposed>
