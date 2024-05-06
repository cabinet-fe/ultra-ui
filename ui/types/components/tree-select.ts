import type {FormComponentProps} from "../component-common"
import type {DeconstructValue} from "../helper"
import type {TreeProps} from "./tree"



/** 树形选择器组件属性 */
export interface TreeSelectProps<Option extends Record<string, any>>
  extends FormComponentProps,TreeProps {
  /**选项值 */
  modelValue?: Array<string | number>
  /** 列表选项 */
  options: Option[]

  /**自定义占位文字 */
  placeholder?: string

  /** 最大展示数量 */
  visibilityLimit?: number
  /** 最大可选数量 */
  max?: number
}

/** 树形选择器组件定义的事件 */
export interface TreeSelectEmits {
  (e: "update:modelValue", value: string): void
}

/** 树形选择器组件暴露的属性和方法(组件内部使用) */
export interface _TreeSelectExposed {}

/** 树形选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeSelectExposed = DeconstructValue<_TreeSelectExposed>
