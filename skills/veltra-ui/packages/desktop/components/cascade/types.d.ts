import type { TreeNode } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface CascadeNode<
  Data extends Record<string, any> = Record<string, any>
> extends TreeNode<Data, CascadeNode<Data>> {
  visible: boolean
  value: string
  label: string
}

/** 级联选择器组件属性 */
export interface CascadeProps extends FormComponentProps {
  /**
   * 分隔符
   * @default '/'
   */
  separator?: string
  /** 数据值 */
  modelValue?: string[] | string
  /** 级联数据项的标签字段 */
  labelKey?: string
  /** 级联数据项的值字段 */
  valueKey?: string
  /** 占位符 */
  placeholder?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 子级字段 */
  childrenKey?: string
  /** 严格模式 */
  strict?: boolean
  /**
   * 是否展示/提交完整路径
   * @default true
   * false 时显示、modelValue、update:label 均只体现选中叶子节点
   */
  showFullPath?: boolean
  /**
   * 数据项
   */
  data?: Record<string, any>[]

  /**
   * 多选
   */
  multiple?: boolean
  /**
   * 搜索
   */
  filterable?: boolean
  visibilityLimit?: number
}

export interface PanelItem {
  key: number
  nodes: CascadeNode[]
}

/** 级联选择器组件定义的事件 */
export interface CascadeEmits {
  /** 触发更新 label 事件 */
  (e: 'update:label', label?: string | string[]): void
  (e: 'update:modelValue', value?: string | string[]): void
  (e: 'change', items: Record<string, any>[]): void
  (e: 'change', item?: Record<string, any>): void
  (e: 'clear'): void
}

/** 级联选择器组件暴露的属性和方法(组件内部使用) */
export interface _CascadeExposed {}

/** 级联选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CascadeExposed = DeconstructValue<_CascadeExposed>
