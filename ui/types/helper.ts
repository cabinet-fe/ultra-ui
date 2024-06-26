import type { VNode } from 'vue'

export type Null<T> = null | T

export type Undef<T> = undefined | T

/** 自定义事件, 可以指定target类型 */
export interface DefineEvent<T = HTMLElement> extends Omit<Event, 'target'> {
  target: T
}

/** 解构VueExpose中被引用的实例 */
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 索引类型 */
export type Index<Keys extends string, Val> = {
  [key in Keys]?: Val
}

/**
 * 渲染函数返回内容
 */
export type RenderReturn = VNode[] | undefined | VNode | string | null | number
