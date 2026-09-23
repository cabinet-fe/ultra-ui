import type { DeconstructValue } from '@veltra/utils'

/** 看板列数据 */
export interface KanbanColumnItem extends Record<string, any> {
  /** 列标识（必填） */
  key: string
  /** 列标题 */
  title?: string
  /** 卡片数据（顺序即展示顺序，拖拽后更新） */
  items: Record<string, any>[]
}

/** 看板组件属性 */
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
  /** 是否禁用拖拽 */
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

/** 看板组件事件 */
export interface KanbanEmits {
  /** 列数据更新（v-model:columns） */
  (e: 'update:columns', columns: KanbanColumnItem[]): void
  /** 拖拽结束后触发（含列内排序与跨列转移），返回最新列数据 */
  (e: 'change', columns: KanbanColumnItem[]): void
}

/** 看板插槽 */
export type KanbanSlots = {
  /** 自定义卡片内容 */
  card?: (props: { card: Record<string, any>; column: KanbanColumnItem; index: number }) => any
  /** 自定义列头 */
  header?: (props: { column: KanbanColumnItem; count: number }) => any
  /** 空列占位 */
  empty?: (props: { column: KanbanColumnItem }) => any
}

/** 看板组件暴露的属性和方法(组件内部使用) */
export interface _KanbanExposed {}

/** 看板组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type KanbanExposed = DeconstructValue<_KanbanExposed>
