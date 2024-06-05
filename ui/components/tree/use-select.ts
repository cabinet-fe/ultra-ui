import { nextTick, shallowRef, watch, type ComputedRef } from 'vue'
import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import type { TreeNode } from './tree-node'

interface Options<DataItem extends Record<string, any>> {
  emit: TreeEmit<DataItem>
  props: TreeProps<DataItem>
  nodeDict: ComputedRef<Map<any, TreeNode<DataItem>>>
}

/**
 * 单选
 */
export function useSelect<DataItem extends Record<string, any>>(
  options: Options<DataItem>
) {
  const { emit, props, nodeDict } = options
  const selected = shallowRef<DataItem>()

  let changedByEvent = false
  watch(
    [() => props.selected, nodeDict],
    ([s]) => {
      if (changedByEvent) return

      selected.value = s ? nodeDict.value.get(s)?.data : undefined
      emit('selected-synced', selected.value)
    },
    { immediate: true }
  )

  const handleSelect = (node: TreeNode<DataItem>) => {
    changedByEvent = true
    if (node.disabled) return
    selected.value = node.data === selected.value ? undefined : node.data

    emit('update:selected', selected.value?.[props.valueKey!], selected.value)

    nextTick(() => {
      changedByEvent = false
    })
  }

  return {
    selected,
    handleSelect
  }
}
