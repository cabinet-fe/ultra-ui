import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import { shallowReactive } from 'vue'
import type { TreeNode } from './tree-node'
import { Tree } from 'cat-kit/fe'

interface Options<DataItem extends Record<string, any>> {
  emit: TreeEmit<DataItem>
  props: TreeProps<DataItem>
}

export function useCheck<DataItem extends Record<string, any>>(
  options: Options<DataItem>
) {
  const { emit, props } = options

  const checked = shallowReactive(new Set<DataItem>())

  function handleCheck(node: TreeNode<DataItem>, check: boolean) {
    const { checkStrictly } = props
    if (check) {
      Tree.dft(node, node => {
        node.checked = true
        checked.add(node.value)
      })

      if (!checkStrictly) {
        let parent = node.parent
        while (parent && parent.depth > 0) {
          parent.checked = parent.children!.every(child => child.checked)
          if (!parent.checked) {
            parent.indeterminate = true
          } else {
            parent.indeterminate = false
            checked.add(parent.value)
          }

          parent = parent.parent
        }
      }
    } else {
      Tree.dft(node, node => {
        node.checked = false
        node.indeterminate = false
        checked.delete(node.value)
      })

      if (!checkStrictly) {
        let parent = node.parent
        while (parent && parent.depth > 0) {
          parent.checked = false
          checked.delete(parent.value)

          parent.indeterminate = parent.children!.some(
            child => child.indeterminate
          ) || parent.children!.some(child => child.checked)

          parent = parent.parent
        }
      }
    }
    emit('check', Array.from(checked))
  }

  return {
    checked,
    handleCheck
  }
}
