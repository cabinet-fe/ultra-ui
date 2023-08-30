import type { ScrollProps } from "../scroll/scroll.type"

/** 虚拟滚动组件属性 */
export interface VirtualScrollProps<DataItem> extends ScrollProps {
  data: DataItem[]
  itemSize?: number
}

/** 虚拟滚动组件定义的事件 */
export interface VirtualScrollEmits {}

/** 虚拟滚动组件暴露的属性和方法 */
export interface VirtualScrollExposed {}
