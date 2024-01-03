/** 传入的items类型 */
export interface Item {
  name: string
  key?: string | number
}

/** 标签页组件组件属性 */
export interface TabsProps {
  modelValue?: string | number
  items: Array<Item | string>
  position?: 'left' | 'right' | 'top' | 'bottom'
  closable?: boolean
}

/** 标签页组件组件定义的事件 */
export interface TabsEmits {
  (e: 'update:modelValue', value: string): void
}

/** 标签页组件组件暴露的属性和方法(组件内部使用) */
export interface _TabsExposed { }

/** 标签页组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TabsExposed { }
