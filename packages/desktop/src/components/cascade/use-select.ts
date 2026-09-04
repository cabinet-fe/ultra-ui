import { Forest } from '@cat-kit/core'
import { createIncrease } from '@veltra/utils'
import {
  computed,
  nextTick,
  shallowRef,
  triggerRef,
  watch,
  type ComputedRef,
  type Ref,
  type ShallowRef
} from 'vue'

import type {
  CascadeProps,
  CascadeEmits,
  CascadeNode,
  DropdownExposed,
  PanelItem
} from '../../types'

interface SelectOptions {
  props: CascadeProps
  emit: CascadeEmits
  isUserActive: () => boolean
  forest: Ref<Forest<Record<string, unknown>, any>>
  dataMap: Ref<Map<string, CascadeNode>>
  dropdownRef: Ref<DropdownExposed | undefined>
}

function buildPathKeys(leaf: CascadeNode): string[] {
  const keys: string[] = []
  let node: CascadeNode | undefined = leaf
  while (node) {
    keys.unshift(node.value)
    node = node.parent
  }
  return keys
}

interface UseSelectReturned {
  displayedValue: ComputedRef<string | undefined>
  selectItem: (panelIndex: number, item: CascadeNode) => void
  selectedNodeKeys: ShallowRef<string[]>
  updateSingleValue: () => void
  initSingleSelect: () => void
  panelItemList: ShallowRef<PanelItem[]>
  getPanelItemList: (data?: CascadeNode[]) => void
  setPanelItem: (panelIndex: number, panelData?: CascadeNode[]) => void
  createPanelItem: (nodes: CascadeNode[]) => PanelItem
}

export function useSelect(options: SelectOptions): UseSelectReturned {
  const { props, emit, dataMap, isUserActive, dropdownRef, forest } = options

  /** 选中的节点key */
  const selectedNodeKeys = shallowRef<string[]>([])

  /** 面板数据 */
  const panelItemList = shallowRef<PanelItem[]>([])
  const uid = createIncrease()
  function createPanelItem(nodes: CascadeNode[]): PanelItem {
    return { key: uid(), nodes: nodes.filter((node) => node.visible) }
  }

  const displayedValue = computed(() => {
    const { modelValue, separator, showFullPath } = props
    if (!modelValue || typeof modelValue !== 'string') return ''

    if (showFullPath) {
      return modelValue
        .split(separator!)
        .map((v) => dataMap.value.get(v)?.label ?? v)
        .join(separator)
    }
    return dataMap.value.get(modelValue)?.label ?? modelValue
  })

  function getPanelItemList(data?: CascadeNode[]) {
    const _panelItemList: Array<PanelItem> = []
    if (!data?.length) return panelItemList
    _panelItemList.push(createPanelItem(data))

    selectedNodeKeys.value.slice(0, -1).forEach((key) => {
      const node = dataMap.value.get(key)
      node?.children?.length && _panelItemList.push(createPanelItem(node.children))
    })

    panelItemList.value = _panelItemList
  }

  function setPanelItem(panelIndex: number, panelData?: CascadeNode[]) {
    if (panelData?.length) {
      panelItemList.value[panelIndex + 1] = createPanelItem(panelData)
      panelItemList.value.splice(panelIndex + 2)
    } else {
      panelItemList.value.splice(panelIndex + 1)
    }

    triggerRef(panelItemList)
  }

  function updateSingleValue() {
    const { separator, showFullPath } = props
    const keys = selectedNodeKeys.value
    const leafKey = keys.length ? keys[keys.length - 1] : undefined
    const leafLabel = leafKey ? dataMap.value.get(leafKey)?.label : undefined

    const targetValue = showFullPath ? (keys.length ? keys.join(separator!) : undefined) : leafKey
    const targetLabel = showFullPath
      ? keys
          .map((key) => dataMap.value.get(key)?.label)
          .filter(Boolean)
          .join(separator!)
      : leafLabel

    const leafNode = leafKey ? dataMap.value.get(leafKey) : undefined
    const changeItem = leafNode?.data ? { ...leafNode.data, fullLabel: targetLabel } : undefined

    emit('update:modelValue', targetValue)
    emit('update:label', targetLabel)
    emit('change', changeItem, targetLabel)
  }

  /**
   * 单选选择
   *
   * @param panelIndex 面板索引
   * @param item 选中的节点
   */
  function selectItem(panelIndex: number, item: CascadeNode) {
    // 设置选中的节点
    selectedNodeKeys.value[panelIndex] = item.value
    selectedNodeKeys.value.splice(panelIndex + 1)
    triggerRef(selectedNodeKeys)

    // 展开子级面板
    setPanelItem(panelIndex, item.children)

    nextTick(() => {
      dropdownRef.value?.updateDropdown()
    })

    if (!item.children?.length && !props.multiple) {
      dropdownRef.value?.close()
    }
  }

  function initSingleSelect() {
    const { modelValue, separator, showFullPath } = props

    if (modelValue && typeof modelValue === 'string') {
      let keys: string[]
      if (showFullPath) {
        keys = modelValue.split(separator!)
      } else {
        const leaf = dataMap.value.get(modelValue)
        keys = leaf ? buildPathKeys(leaf) : [modelValue]
      }
      selectedNodeKeys.value = keys
      getPanelItemList(forest.value.roots)
    } else {
      selectedNodeKeys.value = []
      getPanelItemList(forest.value.roots)
    }
  }

  watch(
    [() => props.multiple, () => props.modelValue, forest],
    ([multiple]) => {
      if (multiple || isUserActive()) return
      initSingleSelect()
    },
    { immediate: true }
  )

  return {
    displayedValue,
    selectItem,
    selectedNodeKeys,
    updateSingleValue,
    initSingleSelect,
    panelItemList,
    getPanelItemList,
    setPanelItem,
    createPanelItem
  }
}
