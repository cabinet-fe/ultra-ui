import { shallowRef } from 'vue'
import type { TreeEmit, TreeProps } from '@ui/types/components/tree'
import type { TreeNode } from './tree-node'

interface Options<DataItem extends Record<string, any>> {
  emit: TreeEmit<DataItem>
  props: TreeProps<DataItem>
}

/**
 * 单选
 */
export function useSelect<DataItem extends Record<string, any>>(
  options: Options<DataItem>
) {
  const { emit, props } = options
  const selected = shallowRef<DataItem>()

  const handleSelect = (node: TreeNode<DataItem>) => {
    if (props.disabledNode?.(node.value, node)) return
    selected.value = node.value === selected.value ? undefined : node.value
    emit('select', selected.value)
  }

  return {
    selected,
    handleSelect
  }
}
