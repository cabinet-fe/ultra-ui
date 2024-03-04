import type { ScrollProps } from './scroll'

/** 虚拟滚动组件属性 */
export interface VirtualListProps<
  DataItem extends Record<string, any> = Record<string, any>
> extends ScrollProps {
  /** 表格数据 */
  data?: DataItem[]
  /** 单项高度 */
  itemHeight?: number
  /** 缓冲数量，防止白屏 */
  bufferSize?: number
  /** 虚拟滚动临界值, 表格数据超过这个长度时会启用虚拟滚动  */
  virtualThreshold?: number
}

/** 虚拟滚动组件定义的事件 */
export interface VirtualListEmits {}

/** 虚拟滚动组件暴露的属性和方法 */
export interface VirtualListExposed {}
