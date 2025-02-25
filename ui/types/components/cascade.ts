import type { DeconstructValue } from '../helper'
import type { FormComponentProps } from '../component-common'
import type { TreeNode as _CascadeNode } from 'cat-kit/fe'

export interface CascadeNode<DataItem extends Record<string, any>>
  extends _CascadeNode<DataItem> {
  parent: CascadeNode<DataItem> | null
  children?: CascadeNode<DataItem>[]
  valueKey: string
  labelKey: string
  visible: boolean
  expanded: boolean
  loading: boolean
  loaded: boolean
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  label: string
  key: string | number
}

/** 级联选择器组件属性 */
export interface CascadeProps extends FormComponentProps {
  /**
   * 分隔符
   * @default '/'
   */
  separator?: string
  /** 数据值 */
  modelValue?: string[] | string
  /** 级联数据项的标签字段 */
  labelKey?: string
  /** 级联数据项的值字段 */
  valueKey?: string
  /** 占位符 */
  placeholder?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 子级字段 */
  childrenKey?: string
  /** 是否严格模式 */
  checkStrictly?: boolean
  /**
   * 数据项
   */
  data?: Record<string, any>[]

  /**
   * 禁用项
   */
  disabledNode?: (
    item: Record<string, any>,
    node: CascadeNode<Record<string, any>>
  ) => boolean
  /**
   * 多选
   */
  multiple?: boolean
  /**
   * 搜索
   */
  filterable?: boolean
  visibilityLimit?: number
}

/** 级联选择器组件定义的事件 */
export interface CascadeEmits {
  (e: 'update:modelValue', value?: string | string[]): void
  (
    e: 'change',
    value: string[],
    label: string[],
    data: Record<string, any>[]
  ): void
  (
    e: 'change',
    value?: string,
    label?: string,
    item?: Record<string, any>
  ): void
  (e: 'clear'): void
}

/** 级联选择器组件暴露的属性和方法(组件内部使用) */
export interface _CascadeExposed {}

/** 级联选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CascadeExposed = DeconstructValue<_CascadeExposed>
