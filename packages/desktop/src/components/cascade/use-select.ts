import { Forest } from '@cat-kit/core'
import type { Updater } from '@ultra-ui/compositions'
import { createIncrease } from '@ultra-ui/utils'
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
  updater: Updater
  forest: Ref<Forest<Record<string, unknown>, any>>
  dataMap: Ref<Map<string, CascadeNode>>
  dropdownRef: Ref<DropdownExposed | undefined>
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
  const { props, emit, dataMap, updater, dropdownRef, forest } = options

  /** 选中的节点key */
  const selectedNodeKeys = shallowRef<string[]>([])

  const currentItem = shallowRef<Record<string, any>>()

  /** 面板数据 */
  const panelItemList = shallowRef<PanelItem[]>([])
  const uid = createIncrease()
  function createPanelItem(nodes: CascadeNode[]): PanelItem {
    return { key: uid(), nodes: nodes.filter((node) => node.visible) }
  }

  const displayedValue = computed(() => {
    const { modelValue, separator } = props
    const valueNodes =
      modelValue && typeof modelValue === 'string' ? modelValue.split(separator!) : undefined
    return valueNodes
      ?.map((v) => {
        const node = dataMap.value.get(v)
        return node?.label ?? v
      })
      .join(props.separator)
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
    const { separator } = props

    const targetValue = selectedNodeKeys.value.length
      ? selectedNodeKeys.value.join(separator!)
      : undefined

    const targetLabel = selectedNodeKeys.value
      .map((key) => {
        const node = dataMap.value.get(key)
        return node?.label
      })
      .filter(Boolean)
      .join(separator!)

    emit('update:modelValue', targetValue)
    emit('change', targetValue, targetLabel, currentItem.value!)
  }

  /**
   * 单选选择
   *
   * @param panelIndex 面板索引
   * @param item 选中的节点
   */
  function selectItem(panelIndex: number, item: CascadeNode) {
    // 设置选中的节点
    currentItem.value = item
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
    const { modelValue, separator } = props

    if (modelValue && typeof modelValue === 'string') {
      const nodes = modelValue.split(separator!)
      selectedNodeKeys.value = nodes
      getPanelItemList(forest.value.roots)
    } else {
      selectedNodeKeys.value = []
      getPanelItemList(forest.value.roots)
    }
  }

  watch(
    [() => props.multiple, () => props.modelValue, forest],
    ([multiple]) => {
      if (multiple) return
      updater.update(() => initSingleSelect())
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
