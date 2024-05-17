import type { ComponentProps } from '../component-common'

export type TabItem = {
  /**
   * 标题名称
   * @description 如果不穿则以key为名称
   */
  name?: string
  /**
   * 标签页唯一标识
   */
  key: string
  /** 是否禁用 */
  disabled?: boolean
}

/** 传入的items类型 */
export type TabsItems = TabItem[]

export type GetTabSlots<T extends string> = {
  [key in T]: (props: { key: key }) => any
} & {
  [key in `name:${T}`]: () => any
}

/** 标签页组件组件属性 */
export interface TabsProps<Items extends TabsItems = TabsItems>
  extends ComponentProps {
  modelValue?: Items[number]['key']
  /** 标签项 */
  items: Items
  /** 显示位置 */
  position?: 'left' | 'right' | 'top' | 'bottom'
  /** 是否允许删除 */
  closable?: boolean
  /** 是否保活 */
  keepAlive?: boolean
  /** 是否允许拖拽排序 */
  // sortable?: boolean
  // beforeLeave?: (
  //   prev: string | number,
  //   next: string | number
  // ) => void | boolean | Promise<void | boolean>
}

/** 标签页组件组件定义的事件 */
export interface TabsEmits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'update:items', items: TabItem[]): void
  (e: 'update:active', active: string | number): void
  (e: 'delete', item: TabItem, index: number): void
  (e: 'click', item: TabItem, index: number): void
}

/** 标签页组件组件暴露的属性和方法(组件内部使用) */
export interface _TabsExposed {}

/** 标签页组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TabsExposed {
  delete(key: number | string): void
}
