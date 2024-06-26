import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'
import type { TreeProps } from './tree'
/** 树形多选组件组件属性 */
export interface MultiTreeSelectProps
  extends FormComponentProps,
    Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable'> {
  modelValue?: (string | number)[]

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
  /**
   * 可见的节点数量限制 默认3
   */
  visibilityLimit?: number

  /**
   * 最小宽度
   * @default '280px'
   */
  minWidth: string
}

/** 树形多选组件组件定义的事件 */
export interface MultiTreeSelectEmits {
  (e: 'clear'): void
  (e: 'change', checked: Record<string, any>[]): void
}

/** 树形多选组件组件暴露的属性和方法(组件内部使用) */
export interface _MultiTreeSelectExposed {}

/** 树形多选组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiTreeSelectExposed = DeconstructValue<_MultiTreeSelectExposed>
