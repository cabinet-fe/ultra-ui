import type { DeconstructValue } from '@veltra/utils'

export interface BackTopProps {
  /** 滚动超出该像素值后显示按钮，默认 400 */
  visibilityHeight?: number
  /** 监听滚动的目标容器：CSS 选择器或元素本身；默认 window 页面滚动 */
  target?: string | HTMLElement
}

export interface BackTopEmits {
  (e: 'click'): void
}

export interface _BackTopExposed {}

/** 回到顶部组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BackTopExposed = DeconstructValue<_BackTopExposed>
