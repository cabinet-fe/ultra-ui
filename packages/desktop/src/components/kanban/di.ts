import type { BEM } from '@veltra/utils'
import type { InjectionKey } from 'vue'

import type { KanbanProps } from '../../types'

/** 看板上下文：主组件向列子组件注入 */
export interface KanbanContext {
  /** 看板组件属性 */
  kanbanProps: KanbanProps
  /** BEM */
  cls: BEM<'kanban'>
  /** 某列卡片重排写回（getter 数据源 onReorder 链路），items 为该列最新完整卡片数组 */
  reorderColumn: (columnKey: string, items: Record<string, any>[]) => void
  /** 拖拽操作结束通知（一次操作只通知一次，主组件据此 emit change） */
  notifyChange: () => void
}

/** 看板依赖注入key */
export const KanbanDIKey: InjectionKey<KanbanContext> = Symbol('KanbanDIKey')
