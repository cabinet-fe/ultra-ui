import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import { nextTick, watch, type ComputedRef } from 'vue'
import type { TreeNode } from './tree-node'
import { Tree } from 'cat-kit/fe'

interface Options {
  emit: TreeEmit
  props: TreeProps
  nodeDict: ComputedRef<Map<any, TreeNode>>
  getFlattedNodes: () => void
}

export function useCheck(options: Options) {
  const { emit, props, nodeDict, getFlattedNodes } = options

  const checkedData = new Set<Record<string, any>>()

  /**
   * 模型值是否由事件触发
   */
  let checkedByEvent = false

  // 回显
  watch(
    [() => props.checked, nodeDict],
    ([c, nodeDict], [oc]) => {
      // 事件已经触发模型变更了，所以不再进行下面的计算
      if (checkedByEvent || !props.checkable) return

      if (!nodeDict.size) return

      oc?.forEach(v => {
        const node = nodeDict.get(v)
        if (node) {
          node.checked = false
          checkedData.delete(node.data)
        }
      })
      c?.forEach(v => {
        const node = nodeDict.get(v)
        if (node) {
          checkedData.add(node.data)
          node.checked = true
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

  function handleCheck(node: TreeNode, check: boolean, ctrlKey?: boolean) {
    const { checkStrictly } = props
    checkedByEvent = true

    if (check) {
      if (ctrlKey) {
        node.checked = check
        checkedData.add(node.data)
      } else {
        Tree.dft(node, node => {
          if (node.disabled) return
          node.checked = true
          checkedData.add(node.data)
        })
      }

      if (!checkStrictly) {
        // 非严格选择时还需要更新父节点，
        // 一旦子节点全部选中，父节点也要设置为选中状态
        node.bubbleSet(node => {
          const { parent } = node
          if (parent && parent.depth > 0) {
            parent.checked = parent.children!.every(child => child.checked)
            if (!parent.checked) {
              parent.indeterminate = true
            } else {
              parent.indeterminate = false
              checkedData.add(parent.data)
            }
          }
        })
      }
    } else {
      if (ctrlKey) {
        node.checked = check
        node.indeterminate = false
        checkedData.delete(node.data)
      } else {
        Tree.dft(node, node => {
          node.checked = false
          node.indeterminate = false
          checkedData.delete(node.data)
        })
      }

      if (!checkStrictly) {
        // 非严格模式下，取消选中时，需要更新父节点
        node.bubbleSet(node => {
          const { parent } = node
          if (parent && parent.depth > 0) {
            parent.checked = false
            checkedData.delete(parent.data)

            parent.indeterminate =
              parent.children!.some(child => child.indeterminate) ||
              parent.children!.some(child => child.checked)
          }
        })
      }
    }

    const checkedArr = Array.from(checkedData)

    emit(
      'update:checked',
      checkedArr.map(item => item[props.valueKey!]),
      checkedArr
    )

    nextTick(() => {
      checkedByEvent = false
    })
  }

  return {
    checkedData,
    handleCheck
  }
}
