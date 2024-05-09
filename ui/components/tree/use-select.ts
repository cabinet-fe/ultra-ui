import { nextTick, shallowRef, watch, type ComputedRef } from 'vue'
import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import type { TreeNode } from './tree-node'

interface Options<DataItem extends Record<string, any>> {
  emit: TreeEmit<DataItem>
  props: TreeProps<DataItem>
  dataDicts: ComputedRef<Map<any, DataItem>>
}

/**
 * 单选
 */
export function useSelect<DataItem extends Record<string, any>>(
  options: Options<DataItem>
) {
  const { emit, props, dataDicts } = options
  const selected = shallowRef<DataItem>()

  let changedByEvent = false
  watch(
    () => props.selected,
    s => {
      if (changedByEvent) return

      selected.value = s ? dataDicts.value.get(s) : undefined
    },
    { immediate: true }
  )

  const handleSelect = (node: TreeNode<DataItem>) => {
    changedByEvent = true
    if (node.disabled) return
    selected.value = node.value === selected.value ? undefined : node.value

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
