import type { TreeNode } from '@cat-kit/core'
import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

export interface CascadeNode<
  Data extends Record<string, any> = Record<string, any>
> extends TreeNode<Data, CascadeNode<Data>> {
  visible: boolean
  value: string
  label: string
}

/** 级联选择器组件属性（移动端形态：面包屑 Tab + 底部面板） */
export interface CascadeProps extends FormComponentProps {
  /**
   * 分隔符
   * @default '/'
   */
  separator?: string
  modelValue?: string[] | string
  labelKey?: string
  /**
   * 兜底展示文案
   * @description 单选 modelValue 未命中数据时展示 text（如回显路径已不在选项中），命中时展示节点 label 路径
   */
  text?: string
  valueKey?: string
  placeholder?: string
  clearable?: boolean
  childrenKey?: string
  /** 严格模式：仅叶子节点提交，非叶子点击只展开下级 */
  strict?: boolean
  /**
   * 是否展示/提交完整路径
   * @default true
   * false 时显示、modelValue、update:label 均只体现选中叶子节点
   */
  showFullPath?: boolean
  data?: Record<string, any>[]
  multiple?: boolean
  filterable?: boolean
  /** 触发器上最多展示的标签数，超出折叠为 +N */
  visibilityLimit?: number
  contentStyle?: CSSProperties | string
  contentClass?: unknown
}

export interface CascadeEmits {
  (e: 'update:label', label?: string | string[]): void
  (e: 'update:modelValue', value?: string | string[]): void
  (
    e: 'change',
    items: (Record<string, any> & { fullLabel?: string })[],
    fullLabels?: string[]
  ): void
  (
    e: 'change',
    item: (Record<string, any> & { fullLabel?: string }) | undefined,
    fullLabel?: string
  ): void
  (e: 'clear'): void
}

export interface _CascadeExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type CascadeExposed = DeconstructValue<_CascadeExposed>
