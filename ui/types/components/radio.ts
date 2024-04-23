import type { DeconstructValue } from '../helper'
import type { FormComponentProps } from '../component-common'
/** 单选框组件属性 */
export interface RadioProps<Val extends number | string | boolean> extends FormComponentProps {
  /** 单选框值 */
  value?: Val
  /** 绑定值 */
  modelValue?: Val
  /** 文本 */
  label?: string
  /**全部禁用 */
  disabled?: boolean
  /** 是否选中 */
  checked?: boolean
}

/** 单选框组件定义的事件 */
export interface RadioEmits {
  (e: 'update:modelValue', value: number | string | boolean): void
}

/** 单选框组件暴露的属性和方法(组件内部使用) */
export interface _RadioExposed {
  change: (isChecked: boolean) => void
}

/** 单选框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioExposed = DeconstructValue<_RadioExposed>
