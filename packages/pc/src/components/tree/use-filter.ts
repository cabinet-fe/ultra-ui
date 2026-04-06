import type { ShallowRef } from 'vue'
import type { TreeNode } from './tree-node'
import type { Forest } from '@ultra-ui/core'

interface Options {
  forest: ShallowRef<Forest<TreeNode>>
  getFlattedNodes: () => void
}

interface UseFilterReturned {
  filter: (filterMethod: string | ((node: TreeNode) => boolean)) => void
}

export function useFilter(options: Options): UseFilterReturned {
  const { forest, getFlattedNodes } = options

  /**
   * 追踪缓存
   * @description
   * 在每一次过滤时，对每个节点的所有祖先节点进行展开，
   * 但这样的代价是巨大的，时间成本为O(nlog(n)). 因此使用一个追踪缓存来减少追踪的次数,
   * 该缓存堆入节点的父节点，如果该父节点已经被堆入则不再进行堆入
   */
  const traceCache = new Set<TreeNode>()

  function defaultFilter(node: TreeNode, qs: string) {
    if (!qs) return true
    return node.label.includes(qs)
  }

  /**
   * 显示回溯
   * @param node 节点
   */
  function trace(node: TreeNode) {
    node.visible = true
    let parent = node.parent

    while (parent && parent.depth !== 0 && !traceCache.has(parent)) {
      traceCache.add(parent)
      parent.expanded = true
      parent.visible = true
      parent = parent.parent
    }

    // 非叶子节点将自身堆入
    if (!node.isLeaf) {
      traceCache.add(node)
    }
  }

  function filter(filterMethod: string | ((node: TreeNode) => boolean)) {
    traceCache.clear()

    const filterFn =
      typeof filterMethod === 'string'
        ? (node: TreeNode) => defaultFilter(node, filterMethod)
        : filterMethod

    forest.value.dft(node => {
      if (filterFn(node)) {
        trace(node)
      } else {
        node.visible = false
      }
    })

    getFlattedNodes()
  }

  return {
    filter
  }
}
