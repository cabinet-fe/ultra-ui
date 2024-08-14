import type { FormComponentProps } from "../component-common"
import type { DeconstructValue } from "../helper"
import type { TreeProps } from "./tree"

/** 树形选择器组件属性 */
export interface TreeSelectProps
  extends FormComponentProps,
    Omit<TreeProps, "selected" | "checked" | "selectable" | "checkable"> {
  modelValue?: string | number

  /** 自定义占位文字 */
  placeholder?: string
  /**
   * 是否可清空
   */
  clearable?: boolean
  /**
   * 是否可搜索
   */
  filterable?: boolean
  /**
   * 最小宽度
   * @default '280px'
   */
  minWidth?: string

  /** 显示文本 */
  text?: string
  /**
   * 自定义数据格式 默认为 value - label
   */
  dataFormat?: (data: Record<string, any>) => string
  customContent?: (data: Record<string, any>) => string
}

/** 树形选择器组件定义的事件 */
export interface TreeSelectEmits {
  (e: "clear"): void
  (
    e: "change",
    value?: string | number,
    selectedData?: Record<string, any>
  ): void
}

/** 树形选择器组件暴露的属性和方法(组件内部使用) */
export interface _TreeSelectExposed {}

/** 树形选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeSelectExposed = DeconstructValue<_TreeSelectExposed>
