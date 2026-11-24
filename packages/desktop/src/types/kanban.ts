import type { DeconstructValue } from '@veltra/utils'

export interface KanbanColumnItem extends Record<string, any> {
  key: string
  title?: string
  /** 卡片数据（顺序即展示顺序，拖拽后更新） */
  items: Record<string, any>[]
}

export interface KanbanProps {
  /** 列数据（含每列卡片），拖拽结果经 update:columns 写回 */
  columns?: KanbanColumnItem[]
  /**
   * 卡片唯一标识字段名
   * @default 'id'
   */
  cardKey?: string
  /**
   * 列标题与默认卡片内容的字段名
   * @default 'title'
   */
  titleKey?: string
  disabled?: boolean
  /**
   * 列头是否显示卡片计数徽标
   * @default true
   */
  countable?: boolean
  /**
   * 空列占位文案（空列仍可作为拖放目标）
   * @default '暂无内容'
   */
  placeholder?: string
}

export interface KanbanEmits {
  (e: 'update:columns', columns: KanbanColumnItem[]): void
  /** 拖拽结束后触发（含列内排序与跨列转移），返回最新列数据 */
  (e: 'change', columns: KanbanColumnItem[]): void
}

export type KanbanSlots = {
  card?: (props: { card: Record<string, any>; column: KanbanColumnItem; index: number }) => any
  header?: (props: { column: KanbanColumnItem; count: number }) => any
  empty?: (props: { column: KanbanColumnItem }) => any
}

export interface _KanbanExposed {}

/** 看板组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type KanbanExposed = DeconstructValue<_KanbanExposed>
