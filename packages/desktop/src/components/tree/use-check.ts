import { dfs, o } from '@cat-kit/core'
import { nextTick, watch, type ComputedRef } from 'vue'

import type { TreeEmit, TreeProps } from '../../types'
import type { TreeNode } from './tree-node'

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

/**
 * 展开目标节点的所有祖先。返回是否发生了实际展开。
 */
function expandAncestors(node: TreeNode): boolean {
  let changed = false
  node.bubbleSet((n) => {
    if (n.parent) {
      if (n.parent.expanded) return false
      n.parent.expanded = true
      changed = true
    }
  })
  return changed
}

export function useCheck(options: Options): UseCheckReturned {
  const { emit, props, nodeDict, getFlattedNodes } = options

  const checkedData = new Set<Record<string, any>>()

  /**
   * 上一次回显使用的 value 集合（仅限 props.checked）。
   * 用于在相同 `nodeDict` 下走差集回显，避免每次全量清空再重建。
   */
  let lastCheckedSet = new Set<unknown>()
  /** 最近一次参与差集比较的 nodeDict 引用；引用变化时视为整棵树重建。 */
  let lastDict: Map<any, TreeNode> | null = null

  function checkNode(node: TreeNode): void {
    if (node.checked) return
    node.checked = true
    if (node.parent) {
      node.parent.childrenCheckCount++
    }
    checkedData.add(node.data)
  }

  function uncheckNode(node: TreeNode): void {
    if (!node.checked) return
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
    ([c, dict]) => {
      // 事件已经触发模型变更了，所以不再进行下面的计算
      if (checkedByEvent || !props.checkable) return
      if (!dict.size) return

      const nextSet = new Set<unknown>(c ?? [])

      // 森林重建（dict 引用变化）→ 走全量清空重建路径，
      // 因为所有 TreeNode 实例都是新的，上一轮缓存的 lastCheckedSet 失效。
      const dictChanged = dict !== lastDict
      if (dictChanged) {
        checkedData.clear()
        lastCheckedSet = new Set()
      }

      let mutated = false

      // 取消：上一轮有但本轮没有的 value
      for (const v of lastCheckedSet) {
        if (!nextSet.has(v)) {
          const node = dict.get(v)
          if (node) {
            uncheckNode(node)
            mutated = true
          }
        }
      }

      // 新增：本轮有但上一轮没有的 value
      let ancestorsExpanded = false
      for (const v of nextSet) {
        if (!lastCheckedSet.has(v) || dictChanged) {
          const node = dict.get(v)
          if (node) {
            checkNode(node)
            mutated = true
            if (expandAncestors(node)) {
              ancestorsExpanded = true
            }
          }
        }
      }

      lastCheckedSet = nextSet
      lastDict = dict

      // 只在真实发生变化时才触发扁平化，避免空转。
      if (mutated || ancestorsExpanded) {
        getFlattedNodes()
      }
    },
    { immediate: true }
  )

  function handleCheck(node: TreeNode, ctrlKey?: boolean) {
    const { checkStrictly } = props

    if (ctrlKey) {
      checkNode(node)
    } else {
      dfs(
        node as unknown as Record<string, unknown>,
        (n) => {
          const tn = n as unknown as TreeNode
          !tn.disabled && checkNode(tn)
        },
        props.childrenKey ?? 'children'
      )
    }

    // 非严格选择时还需要更新祖先节点，
    // 一旦子节点全部选中，父节点也要设置为选中状态
    if (!checkStrictly) {
      node.bubbleSet((node) => {
        const { parent } = node

        if (parent) {
          const parentChecked = parent.childrenCheckCount === parent.children!.length

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
      dfs(
        node as unknown as Record<string, unknown>,
        (n) => {
          const tn = n as unknown as TreeNode
          !tn.disabled && uncheckNode(tn)
        },
        props.childrenKey ?? 'children'
      )
    }

    // 非严格模式下，取消选中时，需要更新父节点
    if (!checkStrictly) {
      node.bubbleSet((node) => {
        const { parent } = node
        if (parent) {
          uncheckNode(parent)
        }
      })
    }
  }

  function toggleCheck(node: TreeNode, check: boolean, ctrlKey?: boolean) {
    checkedByEvent = true

    check ? handleCheck(node, ctrlKey) : handleUncheck(node, ctrlKey)

    const checkedArr = Array.from(checkedData)

    const valueKey = props.valueKey!
    const nextValues = checkedArr.map((item) => o(item).get(valueKey) as unknown)

    // 与外部 checked 保持差集缓存同步，避免下一次 watch 回调把刚勾选的值又误判为“新增”。
    lastCheckedSet = new Set(nextValues)

    emit('update:checked', nextValues as any[], checkedArr)

    nextTick(() => {
      checkedByEvent = false
    })
  }

  return { checkedData, toggleCheck }
}
