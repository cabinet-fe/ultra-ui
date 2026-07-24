import { Forest } from '@cat-kit/core'
import { fieldKey } from '@veltra/utils'
import { computed, shallowRef, triggerRef, watch, type ShallowRef, type ComputedRef } from 'vue'

import type { TreeProps } from '../../types'
import { TreeNode } from './tree-node'

interface Options {
  props: TreeProps
}

interface UseTreeNodesReturned {
  nodes: ShallowRef<TreeNode[]>
  forest: ComputedRef<Forest<Record<string, unknown>, any>>
  getFlattedNodes: () => void
  nodeDict: ComputedRef<Map<string | number, TreeNode>>
  /** 强制刷新 `nodes` 的订阅者（供字段级别变化但列表引用不变时手动触发）。 */
  triggerNodes: () => void
}

export function useTreeNodes(options: Options): UseTreeNodesReturned {
  const { props } = options

  // forest / nodeDict 保持为 shallowRef 而非 computed：
  // - computed 会因为任一 prop 变化（尤其是内联 disabledNode 函数）而整棵重建，
  //   丢失 expanded/checked/visible 等运行时状态；
  // - 显式 watch 仅在真正影响结构的输入变化时才重建，行为可控、可测量。
  const forestRef = shallowRef<Forest<Record<string, unknown>, any>>(
    new Forest<Record<string, unknown>, any>({
      data: [],
      childrenKey: props.childrenKey ?? 'children'
    })
  )

  const nodeDictRef = shallowRef<Map<string | number, TreeNode>>(new Map())

  const nodes = shallowRef<TreeNode[]>([])

  function buildForest(): Forest<Record<string, unknown>, any> {
    const { expandAll = false } = props
    const childrenKey = props.childrenKey ?? 'children'
    const valueKey = fieldKey(props.valueKey, 'value')
    const labelKey = fieldKey(props.labelKey, 'label')

    return new Forest<Record<string, unknown>, any>({
      data: (props.data ?? []) as Record<string, unknown>[],
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
  }

  function rebuildForest(): void {
    const nextForest = buildForest()
    const nextDict = new Map<string | number, TreeNode>()
    const { disabledNode } = props

    // Forest 的 createNode 返回时 children 尚未挂载，因此 disabledNode 必须在
    // 整棵树构建完成后再调用，才能安全访问 node.children / node.isLeaf。
    nextForest.dfs((node) => {
      if (disabledNode && node.data) {
        node.disabled = disabledNode(node.data as Record<string, any>, node) ?? false
      }
      nextDict.set(node.key, node)
    })

    forestRef.value = nextForest
    nodeDictRef.value = nextDict

    getFlattedNodes()
  }

  /** 按展开与可见性扁平化：仅一次 DFS。 */
  function getFlattedNodes(): void {
    const result: TreeNode[] = []
    const roots = forestRef.value.roots as TreeNode[]

    const stack: TreeNode[] = []
    for (let i = roots.length - 1; i >= 0; i--) {
      stack.push(roots[i]!)
    }

    while (stack.length) {
      const node = stack.pop()!
      if (!node.visible) continue
      result.push(node)
      if (node.expanded && node.children && node.children.length) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push(node.children[i]!)
        }
      }
    }

    nodes.value = result
  }

  function triggerNodes(): void {
    triggerRef(nodes)
  }

  watch(
    [
      () => props.data,
      () => props.disabledNode,
      () => props.childrenKey,
      () => props.valueKey,
      () => props.labelKey,
      () => props.expandAll
    ],
    () => {
      rebuildForest()
    },
    { immediate: true }
  )

  const forest = computed(() => forestRef.value)
  const nodeDict = computed(() => nodeDictRef.value)

  return { nodes, forest, getFlattedNodes, nodeDict, triggerNodes }
}
