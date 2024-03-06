import { isFragment } from '@ui/utils'
import { isVNode, useSlots, type VNode } from 'vue'

function useOverrideSlot() {
  const slots = useSlots()

  /**
   * 深度优先遍历虚拟节点
   * @param nodes 虚拟节点
   * @param cb 节点回调
   */
  const traverseNodes = (nodes: VNode[], cb: (node: VNode) => void) => {
    let i = 0
    while (i < nodes.length) {
      const node = nodes[i]!

      if (isFragment(node) && Array.isArray(node.children)) {
        traverseNodes(node.children, cb)
      } else {
        cb(node)
      }
      i++
    }
  }



  const getOverrideNodes = () => {
    const defaultNodes = slots.default?.()
    if (!defaultNodes?.length) return []


    const result: VNode[] = []
    traverseNodes(defaultNodes, node => {

    })
  }
}
