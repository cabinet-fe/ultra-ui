import { nextTick, shallowReactive, watch, type ComputedRef } from "vue"
import type { CascadeNode } from "./cascade-node"
import type { CascadeEmits, CascadeProps } from "@ui/types/components/cascade"

interface Options<DataItem extends Record<string, any>> {
  emit: CascadeEmits<Record<string, any>>
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
  const { emit, props, nodeDict } = options
  const selected = shallowReactive(new Set<DataItem>())
  let currentSelected: DataItem | null = null
  let changedByEvent = false

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

  const handleSelect = (node: CascadeNode<DataItem>) => {
    if (node.disabled) return

    changedByEvent = true

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
    currentSelected = node.data!

    // 获取所有选中的父节点并更新 selected 集合
    const parentNodes = selectParentNodes(node)
    parentNodes.forEach((parentNode) => {
      if (parentNode !== undefined) {
        selected.add(parentNode)
      }
    })
    
    let selectedArr = Array.from(selected)
    emit(
      "update:modelValue",
      selectedArr.map((item) => item[props.valueKey!])
    )
    nextTick(() => {
      changedByEvent = false
    })
  }

  return {
    selected,
    handleSelect,
  }
}
