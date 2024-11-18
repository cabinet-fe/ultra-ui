import type { ShallowRef } from 'vue'
import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: any
  /** 文本内容 */
  text?: string
  /**
   * 列表选项
   * @description 如果传入一个函数，那么filterable会被强制启用
   */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否启用搜索功能 */
  filterable?: boolean
}

export interface SelectEmits {
  /** 触发更新label事件 */
  (e: 'update:label', label?: string): void
  (e: 'update:modelValue', modelValue?: any): void
  (e: 'change', option: Record<string, any>): void
}

export interface _SelectExposed {
  /** 信息文本 */
  infoText: ShallowRef<string | number>
}

export type SelectExposed = DeconstructValue<_SelectExposed>
