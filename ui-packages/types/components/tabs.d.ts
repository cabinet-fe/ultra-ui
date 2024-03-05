/** 传入的items类型 */
export type TabsItems = string[] | Array<{ name: string; key: string | number }>

export interface Item {
  name: string
  key?: string | number
}

/** 标签页组件组件属性 */
export interface TabsProps<Items extends TabsItems> {
  modelValue?: string | number
  items: Items
  position?: 'left' | 'right' | 'top' | 'bottom'
  closable?: boolean
  sortable?: booolean
}

/** 标签页组件组件定义的事件 */
export interface TabsEmits<Item> {
  (e: 'update:modelValue', value: string | number): void
  (e: 'update:items', items: Items): void
  (e: 'update:active', active: string | number): void
  (e: 'delete', item: Items[number], index: number): void
  (e: 'click', item: Items[number], index: number): void
}

/** 标签页组件组件暴露的属性和方法(组件内部使用) */
export interface _TabsExposed { }

/** 标签页组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TabsExposed {
  delete(key: number | string): void
}
