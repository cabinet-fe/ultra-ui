import type {DeconstructValue} from "../helper"
import type {FormComponentProps} from "../component-common"
/** 单选框组件属性 */
export interface RadioProps extends FormComponentProps {
  value?: number | string 
  /**绑定值 */
  modelValue?: number | string | boolean | Array
  /** 原始 name 属性 */
  name?: string
  /** 单选框的值 */
  label?: string
  /**多个按钮时的item */
  itemValue?: Record<string, any>
  /**全部禁用 */
  disabled?: boolean
  /**单选框尺寸 */
  size?: string
}

/** 单选框组件定义的事件 */
export interface RadioEmits {
  (e: "update:modelValue", value: boolean,item: Record<string, any>): void
}

/** 单选框组件暴露的属性和方法(组件内部使用) */
export interface _RadioExposed {
  change: (isChecked: boolean) => void
}

/** 单选框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioExposed = DeconstructValue<_RadioExposed>
