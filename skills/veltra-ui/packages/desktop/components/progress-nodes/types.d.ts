import type { ColorType, DeconstructValue } from '@veltra/utils'

/** 进度节点组件属性 */
export interface ProgressNodesProps {
  /** 当前选中节点的值 */
  modelValue?: string | number
  /** 节点列表 */
  nodes: Record<string, any>[]
  /** 检查节点是否选中的函数 */
  check?: (node: Record<string, any>, index: number) => boolean
  /** 高亮颜色类型 */
  colorType?: ColorType
  /** 最大宽度（用于水平方向滚动） */
  maxWidth?: number | string
  /** 标签键名 */
  labelKey?: string
  /** 值键名 */
  valueKey?: string
}

/** 进度节点组件定义的事件 */
export interface ProgressNodesEmits {
  /** 点击节点时触发 */
  (e: 'click', node: Record<string, any>, index: number): void
  /** 更新选中值时触发 */
  (e: 'update:modelValue', value: string | number): void
}

/** 进度节点组件暴露的属性和方法(组件内部使用) */
export interface _ProgressNodesExposed {}

/** 进度节点组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressNodesExposed = DeconstructValue<_ProgressNodesExposed>
