import { nextTick, shallowReactive, watch, type ComputedRef } from "vue"
import type { CascadeNode } from "./cascade-node"
import type { CascadeEmits, CascadeProps } from "@ui/types/components/cascade"
import { Tree } from "cat-kit/fe"

interface Options<DataItem extends Record<string, any>> {
  emit: CascadeEmits
  props: CascadeProps
  nodeDict: ComputedRef<Map<any, CascadeNode<DataItem>>>
  forest: Record<string, any>
}

/**
 * 单选
 */
export function useSelect<DataItem extends Record<string, any>>(
  options: Options<DataItem>
) {
  const { emit, props, nodeDict, forest } = options
  const selected = shallowReactive(new Set<DataItem>())
  let isEcho = false

  const selectParentNodes = (node: CascadeNode<DataItem>) => {
    let currentNode = node
    const selectedNodes = new Set<DataItem>()
    while (currentNode.parent) {
      currentNode = currentNode.parent
      currentNode.selected = true
      selectedNodes.add(currentNode.data)
    }
    return selectedNodes
  }

  const deselectSiblingNodes = (node: CascadeNode<DataItem>) => {
    if (node.parent) {
      node.parent.children?.forEach((sibling) => {
        if (sibling !== node) {
          sibling.selected = false
          selected.delete(sibling.data)
        }
      })
    }
  }

  watch(
    () => [props.selected, forest.value.nodes],
    ([modelValue, nodes]) => {
      if (isEcho && selected.size !== 0) return
      nodes.forEach((node) => {
        Tree.bft(node, (item) => {
          if (modelValue?.includes(item.data[props.valueKey!])) {
            selected.add(item.data)
            isEcho = false
            deselectSiblingNodes(item)
          }
        })
      })
      nextTick(() => {
        isEcho = true
      })
    },
    {
      immediate: true,
    }
  )

  watch(
    selected,
    (c) => {
      if (!isEcho) return
      isEcho = false
      let selectedArr = Array.from(c)
      emit(
        "update:selected",
        selectedArr.map((item) => item[props.valueKey!])
      )
      emit(
        "change",
        selectedArr.map((item) => item[props.valueKey!]),
        selectedArr.map((item) => item[props.labelKey!]),
        selectedArr
      )
      nextTick(() => {
        isEcho = true
      })
    },
    {
      immediate: true,
    }
  )

  const handleSelect = (node: CascadeNode<DataItem>) => {
    isEcho = true
    if (node.disabled) return

    // 取消同级和子节点的选中状态
    deselectSiblingNodes(node)

    // 移除深度大于当前节点的已选中节点
    selected.forEach((dataItem) => {
      const selectedNode = nodeDict.value.get(dataItem[props.valueKey!])
      if (selectedNode && selectedNode.depth > node.depth) {
        selectedNode.selected = false
        selected.delete(dataItem)
      }
    })
    // 更新选中的节点
    node.selected = true
    selected.add(node.data!)

    // 获取所有选中的父节点并更新 selected 集合
    const parentNodes = selectParentNodes(node)
    parentNodes.forEach((parentNode) => {
      if (parentNode !== undefined) {
        selected.add(parentNode)
      }
    })
  }

  return {
    selected,
    handleSelect,
  }
}
