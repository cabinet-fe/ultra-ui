import type { ScrollProps } from './scroll'

/** 虚拟滚动组件属性 */
export interface VirtualScrollProps<
  DataItem extends Record<string, any> = Record<string, any>
> extends ScrollProps {
  direction?: 'vertical' | 'horizontal'
  /** 表格数据 */
  data?: DataItem[]
  /** 单项尺寸 */
  itemSize?: number
  /** 缓冲数量，防止白屏 */
  bufferSize?: number
  /** 虚拟滚动临界值, 数据超过这个长度时会启用虚拟滚动  */
  threshold?: number
}

/** 虚拟滚动组件定义的事件 */
export interface VirtualScrollEmits {}

/** 虚拟滚动组件暴露的属性和方法 */
export interface VirtualScrollExposed {}
