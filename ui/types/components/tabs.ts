export type TabItem = {
  name: string
  key?: string | number
  disabled?: boolean
}

/** 传入的items类型 */
export type TabsItems = TabItem[]

/** 标签页组件组件属性 */
export interface TabsProps {
  modelValue?: string | number
  items: TabsItems
  position?: 'left' | 'right' | 'top' | 'bottom'
  closable?: boolean
  sortable?: boolean
  beforeLeave?: (
    prev: string | number,
    next: string | number
  ) => void | boolean | Promise<void | boolean>
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
