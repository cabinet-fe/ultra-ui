import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { StyleValue } from 'vue'

export interface GroupInputProps<
  GroupItem extends Record<string, any> = Record<string, any>
> extends FormComponentProps {
  modelValue?: GroupItem[]
  max?: number
  creatable?: boolean
  itemDefault?: Record<string, any>
  itemStyle?: StyleValue
}

export interface GroupInputEmits<GroupItem extends Record<string, any> = Record<string, any>> {
  (e: 'update:modelValue', modelValue: GroupItem[]): void
}

export interface _GroupInputExposed {}

/** 分组输入组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GroupInputExposed = DeconstructValue<_GroupInputExposed>
