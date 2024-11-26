import { nextTick, shallowRef, watch, type ComputedRef } from 'vue'
import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import type { TreeNode } from './tree-node'

interface Options {
  emit: TreeEmit
  props: TreeProps
  nodeDict: ComputedRef<Map<any, TreeNode>>
}

/**
 * 单选
 */
export function useSelect(options: Options) {
  const { emit, props, nodeDict } = options
  const selected = shallowRef<Record<string, any>>()

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

  const handleSelect = (node: TreeNode) => {
    changedByEvent = true
    if (node.disabled) return
    selected.value = node.data === selected.value ? undefined : node.data

    emit(
      'update:selected',
      selected.value?.[props.valueKey!],
      selected.value,
      node
    )

    nextTick(() => {
      changedByEvent = false
    })
  }

  return {
    selected,
    handleSelect
  }
}
