import type { DeconstructValue } from "../helper"
import type { FormComponentProps } from "../component-common"
import type { TreeNode as _CascadeNode } from "cat-kit/fe"

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
  parentExpanded: boolean
  key: string | number
}
export interface CascadeNodeProps extends FormComponentProps {
  cascadeData?: Record<string, any>[]
}

export interface CascadeFilterProps extends FormComponentProps {
  filterData?: Record<string, any>[]
  /**选择并重置 默认false */
  selectAndReset?: boolean
}

/** 级联选择器组件属性 */
export interface CascadeProps<
  DataItem extends Record<string, any> = Record<string, any>,
> extends FormComponentProps,
    CascadeFilterProps {
  modelValue?: any[]
  labelKey?: string
  valueKey?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  childrenKey?: string
  checkStrictly?: boolean
  /**
   * 数据项
   */
  options?: DataItem[]

  /**
   * 禁用项
   */
  disabledNode?: (item: DataItem, node: CascadeNode<DataItem>) => boolean
  /**
   * 多选
   */
  multiple?: boolean
  /** 单选选中项 */
  selected?: any[]
  /** 多选选中项 */
  checked?: any[]
  /**
   * 搜索
   */
  filterable?: boolean
  visibilityLimit?: number
}

/** 级联选择器组件定义的事件 */
export interface CascadeEmits {
  (e: "update:modelValue", value: Record<string, any>[]): void
  (
    e: "change",
    value: any[],
    label: any[],
    data: Record<string, any>[]
  ): void
  (e: "clear"): void
}

/** 级联选择器组件暴露的属性和方法(组件内部使用) */
export interface _CascadeExposed {}

/** 级联选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CascadeExposed = DeconstructValue<_CascadeExposed>
