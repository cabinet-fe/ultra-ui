import { computed, shallowRef } from 'vue'
import { TreeNode } from './tree-node'
import type { TreeProps } from '@ui/types'
import { Forest } from 'cat-kit/fe'

interface Options {
  props: TreeProps
}

export function useTreeNodes(options: Options) {
  const { props } = options

  /** 森林 */
  const forest = computed(() => {
    const { disabledNode, expandAll = false, valueKey, labelKey } = props

    function createNode(data: Record<string, any>, index: number) {
      const node = new TreeNode({
        data,
        index,
        valueKey: valueKey!,
        labelKey: labelKey!
      })
      node.expanded = expandAll
      return node
    }

    return Forest.create(props.data!, {
      createNode: disabledNode
        ? (data, index) => {
            const node = createNode(data, index)
            if (data) {
              node.disabled = disabledNode(data, node) ?? false
            }
            return node
          }
        : createNode
    })
  })

  /** 碾平后的节点 */
  const nodes = shallowRef<TreeNode[]>([])

  /**
   * 节点的字典，key为指定的valueKey的值
   */
  const nodeDict = computed(() => {
    const dict = new Map<string | number, TreeNode>()

    forest.value.dft(node => {
      dict.set(node.key, node)
    })

    return dict
  })

  /** 获取碾平后的节点 */
  function getFlattedNodes() {
    const _nodes: TreeNode[] = []
    forest.value.dft(node => {
      node.visible && _nodes.push(node)
      if (!node.expanded) return false
    })
    nodes.value = _nodes
  }

  return {
    nodes,
    forest,
    getFlattedNodes,
    nodeDict
  }
}
