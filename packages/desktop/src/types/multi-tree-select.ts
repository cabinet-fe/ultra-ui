import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

import type { TreeProps, TreeNode } from './tree'
/** 树形多选组件组件属性 */
export interface MultiTreeSelectProps
  extends
    FormComponentProps,
    Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable' | 'data'> {
  modelValue?: (string | number)[]

  /**
   * 是否渲染某个节点的复选框，签名与 `UTree` 一致，返回值原样透传给内部树。
   * @description 返回 `false` 的节点不渲染 checkbox，也不会作为勾选值：头部全选总数、
   * 标签回显与 `modelValue` 联动都跳过它；其后代各自判定，不受影响。
   * @default 不传时每个节点都渲染复选框
   */
  showCheckbox?: (item: Record<string, any>, node: TreeNode) => boolean

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
