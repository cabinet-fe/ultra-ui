import type { DeconstructValue } from '../helper'
import type { FormComponentProps } from '../component-common'
/** 单选框默认父组件组件属性 */
export interface RadioGroupProps<Item extends Record<string, any>>
  extends FormComponentProps {
  /** 单选框项 */
  items?: Item[]
  /**
   * 选项值key
   * @default 'value'
   */
  valueKey?: keyof Item
  /**
   * 标签文本key
   * @default 'label'
   */
  labelKey?: keyof Item
  /** 禁用 */
  disabled?: boolean | ((item: Item) => boolean)
}

/** 单选框默认父组件组件定义的事件 */
export interface RadioGroupEmits<Item extends Record<string, any>> {
  /** 值更新 */
  (e: 'update:modelValue', modelValue: string | number | boolean): void
  /** 选项更新事件 */
  (e: 'change', item: Item): void
}

/** 单选框默认父组件组件暴露的属性和方法(组件内部使用) */
export interface _RadioGroupExposed {}

/** 单选框默认父组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioGroupExposed = DeconstructValue<_RadioGroupExposed>
