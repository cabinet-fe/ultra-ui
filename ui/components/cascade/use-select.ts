import {
  computed,
  nextTick,
  shallowRef,
  triggerRef,
  watch,
  type ShallowRef
} from 'vue'
import { Forest } from 'cat-kit/fe'
import type {
  CascadeProps,
  CascadeEmits,
  CascadeNode,
  DropdownExposed,
  PanelItem
} from '@ui/types'
import { createIncrease } from '@ui/utils'

interface SelectOptions {
  props: CascadeProps
  emit: CascadeEmits
  update: (fn: Function) => any
  forest: ShallowRef<Forest<CascadeNode>>
  dataMap: ShallowRef<Map<string, CascadeNode>>
  dropdownRef: ShallowRef<DropdownExposed | undefined>
}

export function useSelect(options: SelectOptions) {
  const { props, emit, dataMap, update, dropdownRef, forest } = options

  /** 选中的节点key */
  const selectedNodeKeys = shallowRef<string[]>([])

  const currentItem = shallowRef<Record<string, any>>()

  /** 面板数据 */
  const panelItemList = shallowRef<PanelItem[]>([])
  const uid = createIncrease()
  function createPanelItem(nodes: CascadeNode[]): PanelItem {
    return { key: uid(), nodes: nodes.filter(node => node.visible) }
  }

  const displayedValue = computed(() => {
    const { modelValue, separator } = props
    const valueNodes =
      modelValue && typeof modelValue === 'string'
        ? modelValue.split(separator!)
        : undefined
    return valueNodes
      ?.map(v => {
        const node = dataMap.value.get(v)
        return node?.label ?? v
      })
      .join(props.separator)
  })

  function getPanelItemList(data?: CascadeNode[]) {
    const _panelItemList: Array<PanelItem> = []
    if (!data?.length) return panelItemList
    _panelItemList.push(createPanelItem(data))

    selectedNodeKeys.value.slice(0, -1).forEach(key => {
      const node = dataMap.value.get(key)
      node?.children?.length &&
        _panelItemList.push(createPanelItem(node.children))
    })

    panelItemList.value = _panelItemList
  }

  function setPanelItem(panelIndex: number, panelData?: CascadeNode[]) {
    if (panelData?.length) {
      panelItemList.value[panelIndex + 1] = createPanelItem(panelData)
    }
    panelItemList.value.splice(panelIndex + 2)
    triggerRef(panelItemList)
  }

  function updateSingleValue() {
    const { separator } = props

    const targetValue = selectedNodeKeys.value.length
      ? selectedNodeKeys.value.join(separator!)
      : undefined

    emit('update:modelValue', targetValue)
    emit('change', targetValue, displayedValue.value, currentItem.value!)
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
      getPanelItemList(forest.value.nodes)
    } else {
      selectedNodeKeys.value = []
      getPanelItemList(forest.value.nodes)
    }
  }

  watch(
    [() => props.multiple, () => props.modelValue, forest],
    ([multiple]) => {
      if (multiple) return
      update(() => initSingleSelect())
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
