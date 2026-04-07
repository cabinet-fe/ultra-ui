import type { StyleValue } from 'vue'
import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

/** 分组输入组件属性 */
export interface GroupInputProps<
  GroupItem extends Record<string, any> = Record<string, any>
> extends FormComponentProps {
  modelValue?: GroupItem[]
  /** 最大数量 */
  max?: number
  /** 是否允许创建 */
  creatable?: boolean
  /** 默认值 */
  itemDefault?: Record<string, any>
  /** 输入项样式 */
  itemStyle?: StyleValue
}

/** 分组输入组件定义的事件 */
export interface GroupInputEmits<
  GroupItem extends Record<string, any> = Record<string, any>
> {
  (e: 'update:modelValue', modelValue: GroupItem[]): void
}

/** 分组输入组件暴露的属性和方法(组件内部使用) */
export interface _GroupInputExposed {}

/** 分组输入组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GroupInputExposed = DeconstructValue<_GroupInputExposed>
