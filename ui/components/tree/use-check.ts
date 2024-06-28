import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import { nextTick, shallowReactive, watch, type ComputedRef } from 'vue'
import type { TreeNode } from './tree-node'
import { Tree } from 'cat-kit/fe'

interface Options<DataItem extends Record<string, any>> {
  emit: TreeEmit<DataItem>
  props: TreeProps<DataItem>
  nodeDict: ComputedRef<Map<any, TreeNode<DataItem>>>
}

export function useCheck<DataItem extends Record<string, any>>(
  options: Options<DataItem>
) {
  const { emit, props, nodeDict } = options

  const checked = shallowReactive(new Set<DataItem>())

  /**
   * 模型值是否由事件触发
   */
  let modelChangedByEvent = false
  /**
   * 集合是否由模型变更时而触发。
   */
  let checkedSetChangeByModel = false

  watch(
    [() => props.checked, nodeDict],
    ([c, nodeDict], [oc]) => {
      // 事件已经触发模型变更了，所以不再进行下面的计算
      if (modelChangedByEvent || !props.checkable) return

      if (!nodeDict.size) return

      checkedSetChangeByModel = true
      // 不适用checked.clear()来
      // 减少checked操作次数提升性能

      oc?.forEach(v => {
        const node = nodeDict.get(v)!
        node.checked = false
        checked.delete(node.data)
      })
      c?.forEach(v => {
        const node = nodeDict.get(v)
        if (node) {
          checked.add(node.data)
          node.checked = true
        }
      })

      nextTick(() => {
        checkedSetChangeByModel = false
      })
    },
    { immediate: true }
  )

  watch(checked, c => {
    // 由于模型的变更，所以不再进行下面的计算
    if (checkedSetChangeByModel) return

    modelChangedByEvent = true
    const checkedArr = Array.from(c)

    emit(
      'update:checked',
      checkedArr.map(item => item[props.valueKey!]),
      checkedArr
    )

    nextTick(() => {
      modelChangedByEvent = false
    })
  })

  function handleCheck(node: TreeNode<DataItem>, check: boolean) {
    const { checkStrictly } = props
    if (check) {
      Tree.dft(node, node => {
        if (node.disabled) return
        node.checked = true
        checked.add(node.data)
      })

      if (!checkStrictly) {
        let parent = node.parent
        while (parent && parent.depth > 0) {
          parent.checked = parent.children!.every(child => child.checked)
          if (!parent.checked) {
            parent.indeterminate = true
          } else {
            parent.indeterminate = false
            checked.add(parent.data)
          }

          parent = parent.parent
        }
      }
    } else {
      Tree.dft(node, node => {
        node.checked = false
        node.indeterminate = false
        checked.delete(node.data)
      })

      if (!checkStrictly) {
        let parent = node.parent
        while (parent && parent.depth > 0) {
          parent.checked = false
          checked.delete(parent.data)

          parent.indeterminate =
            parent.children!.some(child => child.indeterminate) ||
            parent.children!.some(child => child.checked)

          parent = parent.parent
        }
      }
    }
  }

  return {
    checked,
    handleCheck
  }
}
