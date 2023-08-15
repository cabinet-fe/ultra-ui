import { PropsWithServerQuery } from "@ui/shared"
import type { CustomTreeNode } from "./tree-node"

/** 树组件属性 */
export interface TreeProps<DataItem extends Record<string, any> = Record<string, any>> extends PropsWithServerQuery {
  /** 是否展开所有节点 */
  expandAll?: boolean
  /** label键 */
  labelKey?: string
  /** value键 */
  valueKey?: string
  /** 子节点键 */
  childrenKey?: string
  /** 数据 */
  data: DataItem[]
  /** 可多选 */
  checkable?: boolean | ((item: DataItem, node: CustomTreeNode<DataItem>) => boolean)
  /** 可单选 */
  select?: boolean | ((item: DataItem, node: CustomTreeNode<DataItem>) => boolean)
}
