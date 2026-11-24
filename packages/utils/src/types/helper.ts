import type { VNode } from 'vue'

export type Null<T> = null | T

export type Undef<T> = undefined | T

export interface DefineEvent<T = HTMLElement> extends Omit<Event, 'target'> {
  target: T
}

/** 解构VueExpose中被引用的实例 */
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export type Index<Keys extends string, Val> = {
  [key in Keys]?: Val
}

export type RenderReturn =
  | (undefined | VNode | string | null | number)[]
  | undefined
  | VNode
  | string
  | null
  | number
