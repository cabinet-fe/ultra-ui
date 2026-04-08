import { computed, shallowRef, type ShallowRef, type ComputedRef } from 'vue'
import { TreeNode } from './tree-node'
import type { TreeProps } from '@ultra-ui/desktop/types'
import { Forest } from '@cat-kit/core'
import { forestRootsDftPrune } from '../../utils/tree-walk'

interface Options {
  props: TreeProps
}

interface UseTreeNodesReturned {
  nodes: ShallowRef<TreeNode[]>
  forest: ComputedRef<Forest<Record<string, unknown>, any>>
  getFlattedNodes: () => void
  nodeDict: ComputedRef<Map<string | number, TreeNode>>
}
export function useTreeNodes(options: Options): UseTreeNodesReturned {
  const { props } = options

  /** 森林 */
  const forest = computed(() => {
    const { disabledNode, expandAll = false, valueKey, labelKey } = props
    const childrenKey = props.childrenKey ?? 'children'

    function createNode(
      data: Record<string, any>,
      index: number,
      depth: number,
      _f: Forest<Record<string, unknown>, any>,
      parent?: TreeNode
    ) {
      const node = new TreeNode({
        data,
        index,
        depth,
        parent: parent ?? null,
        valueKey: valueKey!,
        labelKey: labelKey!
      })
      node.expanded = expandAll
      return node
    }

    return new Forest<Record<string, unknown>, any>({
      data: props.data! as Record<string, unknown>[],
      childrenKey,
      createNode: disabledNode
        ? (data, index, depth, f, parent) => {
            const node = createNode(data as Record<string, any>, index, depth, f, parent as TreeNode)
            if (data) {
              node.disabled = disabledNode(data, node) ?? false
            }
            return node
          }
        : (data, index, depth, f, parent) =>
            createNode(data as Record<string, any>, index, depth, f, parent as TreeNode)
    })
  })

  /** 碾平后的节点 */
  const nodes = shallowRef<TreeNode[]>([])

  /**
   * 节点的字典，key为指定的valueKey的值
   */
  const nodeDict = computed(() => {
    const dict = new Map<string | number, TreeNode>()

    forest.value.dfs(node => {
      dict.set(node.key, node)
    })

    return dict
  })

  /** 获取碾平后的节点 */
  function getFlattedNodes() {
    const _nodes: TreeNode[] = []
    const childrenKey = props.childrenKey ?? 'children'
    forestRootsDftPrune(
      forest.value.roots,
      node => {
        node.visible && _nodes.push(node)
        if (!node.expanded) return false
      },
      childrenKey
    )
    nodes.value = _nodes
  }

  return {
    nodes,
    forest,
    getFlattedNodes,
    nodeDict
  }
}
