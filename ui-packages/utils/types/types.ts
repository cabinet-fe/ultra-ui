export type Null<T> = null | T

export type Undef<T> = undefined | T

/** 自定义事件, 可以指定target类型 */
export interface DefineEvent<T = HTMLElement> extends Omit<Event, 'target'> {
  target: T
}
