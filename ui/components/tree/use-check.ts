import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import { nextTick, shallowReactive, watch, type ComputedRef } from 'vue'
import type { TreeNode } from './tree-node'
import { Tree } from 'cat-kit/fe'

interface Options<DataItem extends Record<string, any>> {
  emit: TreeEmit<DataItem>
  props: TreeProps<DataItem>
  nodeDicts: ComputedRef<Map<any, TreeNode<DataItem>>>
}

export function useCheck<DataItem extends Record<string, any>>(
  options: Options<DataItem>
) {
  const { emit, props, nodeDicts } = options

  const checked = shallowReactive(new Set<DataItem>())

  /** 仅在非事件触发条件下更新checked */
  let checkedByEvent = false
  watch(
    () => props.checked,
    (c, oc) => {
      if (checkedByEvent) return

      // 不适用checked.clear()来
      // 减少checked操作次数提升性能
      oc?.forEach(v => {
        const node = nodeDicts.value.get(v)!
        node.checked = false
        checked.delete(node.value)
      })
      c?.forEach(v => {
        const node = nodeDicts.value.get(v)
        if (node) {
          checked.add(node.value)
          node.checked = true
        }
      })
    },
    { immediate: true }
  )

  function handleCheck(node: TreeNode<DataItem>, check: boolean) {
    checkedByEvent = true
    const { checkStrictly } = props
    if (check) {
      Tree.dft(node, node => {
        if (node.disabled) return
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

          parent.indeterminate =
            parent.children!.some(child => child.indeterminate) ||
            parent.children!.some(child => child.checked)

          parent = parent.parent
        }
      }
    }
    const checkedArr = Array.from(checked)

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
    checked,
    handleCheck
  }
}
