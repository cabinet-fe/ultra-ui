import { Forest } from '@cat-kit/core'
import { fieldKey } from '@veltra/utils'

import type { TreeProps } from '../../types'
import { TreeNode } from './tree-node'

/** 构建森林所需的节点级判定输入 */
export type TreeForestOptions = Pick<
  TreeProps,
  'data' | 'childrenKey' | 'valueKey' | 'labelKey' | 'expandAll' | 'disabledNode' | 'showCheckbox'
>

/**
 * 按 props 构建森林，并在整棵树挂载完成后完成节点级判定。
 * @description Forest 的 createNode 返回时 children 尚未挂载，因此 `disabledNode` /
 * `showCheckbox` 必须整棵树构建完成后再调用，才能安全访问 `node.children` / `node.isLeaf`。
 * 树组件与 UMultiTreeSelect 共用本函数，保证两侧对「复选框是否可见」判定一致。
 */
export function createTreeForest(options: TreeForestOptions): Forest<Record<string, unknown>, any> {
  const { expandAll = false } = options
  const childrenKey = options.childrenKey ?? 'children'
  const valueKey = fieldKey(options.valueKey, 'value')
  const labelKey = fieldKey(options.labelKey, 'label')

  const forest = new Forest<Record<string, unknown>, any>({
    data: (options.data ?? []) as Record<string, unknown>[],
    childrenKey,
    createNode: (data, index, depth, _f, parent) => {
      const node = new TreeNode({
        data: data as Record<string, any>,
        index,
        depth,
        parent: parent as TreeNode | undefined,
        valueKey,
        labelKey
      })
      node.expanded = expandAll
      return node
    }
  })

  const { disabledNode, showCheckbox } = options

  if (disabledNode) {
    forest.dfs((node) => {
      const tn = node as unknown as TreeNode
      if (!tn.data) return
      tn.disabled = disabledNode(tn.data as Record<string, any>, tn) ?? false
    })
  }

  // showCheckbox 可能读取 node.disabled（如按禁用状态决定是否渲染复选框），
  // 因此单独一轮：等全部节点的 disabled 判定完再调用。
  if (showCheckbox) {
    forest.dfs((node) => {
      const tn = node as unknown as TreeNode
      if (!tn.data) return
      tn.showCheckbox = showCheckbox(tn.data as Record<string, any>, tn) !== false
    })
  }

  return forest
}
