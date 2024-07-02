import type { DeconstructValue } from "../helper"

/** 级联选择器组件属性 */
export interface CascadeProps {
  modelValue?: any[]
  labelKey?: string
  valueKey?: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  childrenKey?: string
  /**
   * 数据项
   */
  options?: Record<string, any>[]

  /**
   * 禁用项
   */
  disabledNode?: Record<string, any>[]
  multiple?: boolean
  /** 单选选中项 */
  selected?: any[]
  /** 多选选中项 */
  checked?: any[]
  /**
   * 搜索
   */
  filterable?:boolean
}
export interface CascadeItemProps {
  cascadeData?: Record<string, any>[]
}

/** 级联选择器组件定义的事件 */
export interface CascadeEmits<Option extends Record<string, any>> {
  (e: "update:modelValue", value: any): void
  (e: "update:selected", value: any[]): void
  (e: "update:checked", value: any[]): void
  (e: "change", value: Option[]): void
}

/** 级联选择器组件暴露的属性和方法(组件内部使用) */
export interface _CascadeExposed {}

/** 级联选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CascadeExposed = DeconstructValue<_CascadeExposed>
