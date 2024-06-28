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

/** 标签页组件组件属性 */
export interface TabsProps extends ComponentProps {
  modelValue?: string
  /** 标签项 */
  items: TabItem[]
  /** 显示位置 */
  position?: 'left' | 'right' | 'top' | 'bottom'
  /** 是否可以动态编辑 */
  editable?: boolean
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
