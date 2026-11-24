import type { ColorType, DeconstructValue } from '@veltra/utils'

export interface ProgressNodesProps {
  modelValue?: string | number
  nodes: Record<string, any>[]
  check?: (node: Record<string, any>, index: number) => boolean
  colorType?: ColorType
  /** 最大宽度（用于水平方向滚动） */
  maxWidth?: number | string
  labelKey?: string
  valueKey?: string
}

export interface ProgressNodesEmits {
  (e: 'click', node: Record<string, any>, index: number): void
  (e: 'update:modelValue', value: string | number): void
}

export interface _ProgressNodesExposed {}

/** 进度节点组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressNodesExposed = DeconstructValue<_ProgressNodesExposed>
