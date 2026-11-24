import type { DeconstructValue } from '@veltra/utils'

export interface EmptyProps {
  /** 图标大小, 默认48 */
  size?: number

  text?: string

  /**
   * 块级模式：撑满父容器并将内容水平垂直居中
   * @description 默认 inline-block，是否居中取决于父容器
   */
  block?: boolean
}

export interface EmptyEmits {}

export interface _EmptyExposed {}

/** 空内容组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type EmptyExposed = DeconstructValue<_EmptyExposed>
