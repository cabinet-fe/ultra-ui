import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

import type { TreeProps } from './tree'

/** 树形选择器组件属性 */
export interface TreeSelectProps
  extends
    FormComponentProps,
    Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable' | 'data'> {
  modelValue?: string | number

  /**
   * 兜底展示文案
   * @description modelValue 未命中树节点时展示 text（如回显数据已不在选项中），命中时展示节点 label
   */
  text?: string

  /**
   * 树数据
   * @description 如果传入一个函数，那么filterable会被强制启用；
   * 函数按查询词返回匹配的树，初始以空串调用一次（加载默认树）
   */
  data?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])

  /** 自定义占位文字 */
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
   * 最小宽度
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

/** 树形选择器组件定义的事件 */
export interface TreeSelectEmits {
  (e: 'clear'): void
  (e: 'update:modelValue', value?: string | number): void
  (e: 'change', selectedData?: Record<string, any>): void
  /**
   * 选中项文案变化（用于同步父级冗余字段）
   * @description 命中节点时发出 label，清空时发出 undefined；未命中节点时，
   * 传了 text 兜底则不发出（父级文案已是事实来源），未传 text 时发出 undefined；readonly 下不发出
   */
  (e: 'update:text', text?: string): void
}

/** 树形选择器组件暴露的属性和方法(组件内部使用) */
export interface _TreeSelectExposed {}

/** 树形选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeSelectExposed = DeconstructValue<_TreeSelectExposed>
