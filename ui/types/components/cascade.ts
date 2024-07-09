import type { DeconstructValue } from "../helper"
import type { FormComponentProps } from '../component-common'

/** 级联选择器组件属性 */
export interface CascadeProps extends FormComponentProps {
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
  options?: Record<string, any>[]

  /**
   * 禁用项
   */
  disabledNode?: Record<string, any>[]
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
export interface CascadeNodeProps extends FormComponentProps {
  cascadeData?: Record<string, any>[]
}

export interface CascadeFilterProps extends FormComponentProps {
  filterData?: Record<string, any>[]
}

/** 级联选择器组件定义的事件 */
export interface CascadeEmits {
  (e: "update:modelValue", value: Record<string, any>[]): void
  (
    e: "change",
    value: string[] | number[],
    label: string[],
    data: Record<string, any>
  ): void
  (e: "clear"): void
}

/** 级联选择器组件暴露的属性和方法(组件内部使用) */
export interface _CascadeExposed {}

/** 级联选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CascadeExposed = DeconstructValue<_CascadeExposed>
