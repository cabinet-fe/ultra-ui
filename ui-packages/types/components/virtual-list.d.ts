import type { ScrollProps } from './scroll'

/** 虚拟滚动组件属性 */
export interface VirtualListProps<
  DataItem extends Record<string, any> = Record<string, any>
> extends ScrollProps {
  data: DataItem[]
  itemSize?: number
}

/** 虚拟滚动组件定义的事件 */
export interface VirtualListEmits {}

/** 虚拟滚动组件暴露的属性和方法 */
export interface VirtualListExposed {}
