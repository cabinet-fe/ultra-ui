import type { DeconstructValue, FormComponentProps } from '@veltra/utils'
import type { CSSProperties } from 'vue'

import type { TreeProps } from './tree'

/** 树形选择器组件属性 */
export interface TreeSelectProps
  extends FormComponentProps, Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable'> {
  modelValue?: string | number

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
   * 选中项文案变化（单向通知，用于同步父级冗余字段）
   * @description 展示始终由 data 推导，请用 `@update:text` 而非 `v-model:text`
   */
  (e: 'update:text', text?: string): void
}

/** 树形选择器组件暴露的属性和方法(组件内部使用) */
export interface _TreeSelectExposed {}

/** 树形选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeSelectExposed = DeconstructValue<_TreeSelectExposed>
