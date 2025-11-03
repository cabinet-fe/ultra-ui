import type { TreeEmit, TreeProps } from '@ui/types'
import { nextTick, watch, type ComputedRef } from 'vue'
import type { TreeNode } from './tree-node'
import { getChainValue, Tree } from 'cat-kit/fe'

interface Options {
  emit: TreeEmit
  props: TreeProps
  nodeDict: ComputedRef<Map<any, TreeNode>>
  getFlattedNodes: () => void
}

interface UseCheckReturned {
  checkedData: Set<Record<string, any>>
  toggleCheck: (node: TreeNode, check: boolean, ctrlKey?: boolean) => void
}

export function useCheck(options: Options): UseCheckReturned {
  const { emit, props, nodeDict, getFlattedNodes } = options

  const checkedData = new Set<Record<string, any>>()

  function checkNode(node: TreeNode) {
    node.checked = true
    if (node.parent) {
      node.parent.childrenCheckCount++
    }
    checkedData.add(node.data)
  }

  function uncheckNode(node: TreeNode) {
    node.checked = false
    if (node.parent) {
      node.parent.childrenCheckCount--
    }
    checkedData.delete(node.data)
  }

  /**
   * 模型值是否由事件触发
   */
  let checkedByEvent = false

  // 回显
  watch(
    [() => props.checked, nodeDict],
    ([c, nodeDict]) => {
      // 事件已经触发模型变更了，所以不再进行下面的计算
      if (checkedByEvent || !props.checkable) return

      if (!nodeDict.size) return
      checkedData.clear()

      c?.forEach(v => {
        const node = nodeDict.get(v)
        if (node) {
          checkNode(node)
          node.bubbleSet(node => {
            if (node.parent) {
              if (node.parent.expanded) return false
              node.parent.expanded = true
            }
          })
        }
      })

      getFlattedNodes()
    },
    { immediate: true }
  )

  function handleCheck(node: TreeNode, ctrlKey?: boolean) {
    const { checkStrictly } = props

    if (ctrlKey) {
      checkNode(node)
    } else {
      Tree.dft(node, node => {
        !node.disabled && checkNode(node)
      })
    }

    // 非严格选择时还需要更新祖先节点，
    // 一旦子节点全部选中，父节点也要设置为选中状态
    if (!checkStrictly) {
      node.bubbleSet(node => {
        const { parent } = node

        if (parent && parent.depth > 0) {
          const parentChecked =
            parent.childrenCheckCount === parent.children!.length

          parentChecked ? checkNode(parent) : uncheckNode(parent)
        }
      })
    }
  }

  function handleUncheck(node: TreeNode, ctrlKey?: boolean) {
    const { checkStrictly } = props
    if (ctrlKey) {
      uncheckNode(node)
    } else {
      Tree.dft(node, node => uncheckNode(node))
    }

    // 非严格模式下，取消选中时，需要更新父节点
    if (!checkStrictly) {
      node.bubbleSet(node => {
        const { parent } = node
        if (parent && parent.depth > 0) {
          uncheckNode(parent)
        }
      })
    }
  }

  function toggleCheck(node: TreeNode, check: boolean, ctrlKey?: boolean) {
    checkedByEvent = true

    check ? handleCheck(node, ctrlKey) : handleUncheck(node, ctrlKey)

    const checkedArr = Array.from(checkedData)

    emit(
      'update:checked',
      checkedArr.map(item => getChainValue(item, props.valueKey!)),
      checkedArr
    )

    nextTick(() => {
      checkedByEvent = false
    })
  }

  return {
    checkedData,
    toggleCheck
  }
}
