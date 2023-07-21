/** 虚拟滚动组件属性 */
export interface VirtualScrollProps<DataItem> {
  data: DataItem[]
  itemSize?: number
  /** 渲染池大小, 默认200 */
  poolSize?: number
}

/** 虚拟滚动组件定义的事件 */
export interface VirtualScrollEmits {}

/** 虚拟滚动组件暴露的属性和方法 */
export interface VirtualScrollExposed {}
