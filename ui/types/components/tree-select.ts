import type { FormComponentProps } from "../component-common"
import type { DeconstructValue } from "../helper"
import type { TreeProps } from "./tree"

/** 树形选择器组件属性 */
export interface TreeSelectProps<Val extends string | number>
  extends FormComponentProps,
    TreeProps {
  modelValue?: any

  /**自定义占位文字 */
  placeholder?: string
  /**
   * 是否可清空
   */
  clearable?: boolean
  /**
   * 是否可搜索
   */
  filterable?: boolean

  /** 多选 */
  multiple?: boolean

  /**
   * 选择完自动关闭
   */
  closeOnSelect?: boolean
}

/** 树形选择器组件定义的事件 */
export interface TreeSelectEmits<Val extends string | number | undefined> {
  (e: "clear", value: Val[]): void
  (e: "update:modelValue", value: any): void
}

/** 树形选择器组件暴露的属性和方法(组件内部使用) */
export interface _TreeSelectExposed {}

/** 树形选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeSelectExposed = DeconstructValue<_TreeSelectExposed>
