import {
  nextTick,
  shallowRef,
  watch,
  type ComputedRef,
  type ShallowRef
} from 'vue'
import type { TreeEmit, TreeProps } from '@ui/types'
import type { TreeNode } from './tree-node'

interface Options {
  emit: TreeEmit
  props: TreeProps
  nodeDict: ComputedRef<Map<any, TreeNode>>
  getFlattedNodes: () => void
}

interface UseSelectReturned {
  selectedData: ShallowRef<Record<string, any> | undefined>
  handleSelect: (node: TreeNode) => void
}

/**
 * 单选
 */
export function useSelect(options: Options): UseSelectReturned {
  const { emit, props, nodeDict, getFlattedNodes } = options
  let selectedData = shallowRef<Record<string, any>>()

  let selectByEvent = false
  watch(
    [() => props.selected, nodeDict],
    ([s, nodeDict]) => {
      if (selectByEvent || !props.selectable) return

      if (s) {
        const node = nodeDict.get(s)
        if (node) {
          selectedData.value = node.data
          node.bubbleSet(node => {
            if (node.parent) {
              if (node.parent.expanded) return false
              node.parent.expanded = true
            }
          })
        }
      } else {
        selectedData.value = undefined
      }

      getFlattedNodes()

      emit('selected-synced', selectedData.value)
    },
    { immediate: true }
  )

  const handleSelect = (node: TreeNode) => {
    selectByEvent = true
    if (node.disabled) return
    selectedData.value =
      node.data === selectedData.value ? undefined : node.data

    emit(
      'update:selected',
      selectedData.value?.[props.valueKey!],
      selectedData.value,
      node
    )

    nextTick(() => {
      selectByEvent = false
    })
  }

  return {
    selectedData,
    handleSelect
  }
}
