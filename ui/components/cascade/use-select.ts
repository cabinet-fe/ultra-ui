import {
  computed,
  nextTick,
  shallowRef,
  triggerRef,
  type ShallowRef
} from 'vue'
import { getChainValue } from 'cat-kit/fe'
import type { CascadeProps, CascadeEmits, DropdownExposed } from '@ui/types'
import { createIncrease } from '@ui/utils'

interface SelectOptions {
  props: CascadeProps
  emit: CascadeEmits
  dataMap: ShallowRef<Map<string, Record<string, any>>>
  dropdownRef: ShallowRef<DropdownExposed | undefined>
}

export function useSelect(options: SelectOptions) {
  const { props, emit, dataMap, dropdownRef } = options

  /** 选中的节点key */
  const selectedNodeKeys = shallowRef<string[]>([])

  const currentItem = shallowRef<Record<string, any>>()

  /** 面板数据 */
  const panelItemList = shallowRef<
    Array<{
      key: number
      items: Record<string, any>[]
    }>
  >([])

  const displayedValue = computed(() => {
    if (!selectedNodeKeys.value.length) return undefined
    return selectedNodeKeys.value
      .map(v => {
        const item = dataMap.value.get(v)
        return item ? getChainValue(item, props.labelKey!) : v
      })
      .join(props.separator)
  })

  const uid = createIncrease()

  function createPanelItem(data: Record<string, any>[]) {
    return { key: uid(), items: data }
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
  function selectItem(panelIndex: number, item: Record<string, any>) {
    const { childrenKey, valueKey } = props

    const children = getChainValue(item, childrenKey!)

    // 设置选中的节点
    currentItem.value = item
    selectedNodeKeys.value[panelIndex] = getChainValue(item, valueKey!)
    selectedNodeKeys.value.splice(panelIndex + 1)
    triggerRef(selectedNodeKeys)

    // 展开子级面板
    if (children?.length) {
      panelItemList.value[panelIndex + 1] = createPanelItem(children)
    }
    panelItemList.value.splice(panelIndex + 2)
    triggerRef(panelItemList)

    nextTick(() => {
      dropdownRef.value?.updateDropdown()
    })

    if (!children?.length) {
      dropdownRef.value?.close()
    }

    return children
  }

  function initSingleSelect() {
    const { modelValue, childrenKey, data, separator } = props

    if (modelValue && typeof modelValue === 'string') {
      const nodes = modelValue.split(separator!)
      selectedNodeKeys.value = nodes
      const dataList = nodes
        .slice(0, -1)
        .map(v => {
          const item = dataMap.value.get(v)
          return createPanelItem(item ? getChainValue(item, childrenKey!) : [])
        })
        .filter(d => !!d.items.length)
      panelItemList.value = [createPanelItem(data!), ...dataList]
    } else {
      selectedNodeKeys.value = []
      panelItemList.value = [createPanelItem(data!)]
    }
  }

  return {
    displayedValue,
    selectItem,
    selectedNodeKeys,
    updateSingleValue,
    initSingleSelect,
    panelItemList,
    createPanelItem
  }
}
