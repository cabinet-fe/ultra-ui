import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

import type { TreeProps } from './tree'
/** 树形多选组件组件属性 */
export interface MultiTreeSelectProps
  extends
    FormComponentProps,
    Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable' | 'data'> {
  modelValue?: (string | number)[]

  /**
   * 树数据
   * @description 如果传入一个函数，那么filterable会被强制启用；
   * 函数按查询词返回匹配的树，初始以空串调用一次（加载默认树）
   */
  data?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])

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
   * 弹框最小宽度
   * @default '280px'
   */
  minWidth?: string
  /**
   * 弹框宽度
   * @default 跟随触发元素的宽度
   */
  width?: string
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
}

/** 树形多选组件组件定义的事件 */
export interface MultiTreeSelectEmits {
  (e: 'clear'): void
  (e: 'update:modelValue', value: any[]): void
  (e: 'change', checked: Record<string, any>[]): void
}

/** 树形多选组件组件暴露的属性和方法(组件内部使用) */
export interface _MultiTreeSelectExposed {}

/** 树形多选组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiTreeSelectExposed = DeconstructValue<_MultiTreeSelectExposed>
