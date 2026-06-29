import { dfs, type Forest } from '@cat-kit/core'
import {
  computed,
  shallowRef,
  triggerRef,
  watch,
  type ComputedRef,
  type Ref,
  type ShallowRef
} from 'vue'

import type { CascadeProps, CascadeEmits, CascadeNode } from '../../types'

interface CheckOptions {
  props: CascadeProps
  emit: CascadeEmits
  dataMap: ShallowRef<Map<string, CascadeNode>>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  forest: Ref<Forest<Record<string, unknown>, any>>
  isUserActive: () => boolean
  getPanelItemList: (data?: CascadeNode[]) => void
}

interface UseCheckReturned {
  hovered: ShallowRef<boolean>
  tags: ComputedRef<CascadeNode[]>
  checkedSet: ShallowRef<Set<CascadeNode>>
  restTag: ComputedRef<number>
  handleCloseTag: (tag: CascadeNode) => void
  updateMultipleValue: () => void
  checkItem: (item: CascadeNode, checked: boolean) => void
}

export function useCheck(options: CheckOptions): UseCheckReturned {
  const { props, emit, dataMap, disabled, readonly, forest, isUserActive, getPanelItemList } =
    options

  const hovered = shallowRef(false)

  const checkedSet = shallowRef(new Set<CascadeNode>())

  const tags = computed(() => {
    const { modelValue, multiple } = props
    let tags: CascadeNode[] = []

    if (!multiple || !Array.isArray(modelValue)) return tags

    let { visibilityLimit } = props
    if (visibilityLimit! < 0) {
      visibilityLimit = 0
    }

    // 禁用时，显示全部
    if (disabled.value || readonly.value) {
      visibilityLimit = props.modelValue?.length ?? 0
    }

    modelValue.slice(0, visibilityLimit).forEach((k) => {
      const option = dataMap.value.get(k)
      option && tags.push(option)
    })

    return tags
  })

  function updateMultipleValue() {
    const checkedArr = Array.from(checkedSet.value)
    const targetValues = checkedArr.map((item) => item.value)
    const targetLabels = checkedArr.map((item) => item.label)
    const targetItems = checkedArr.map((item) => item.data as Record<string, any>)
    emit('update:modelValue', targetValues)
    emit('update:label', targetLabels.length ? targetLabels : undefined)
    emit('change', targetItems)
  }

  const restTag = computed(() => {
    const { visibilityLimit, modelValue } = props

    return Math.max((modelValue?.length ?? 0) - visibilityLimit!, 0)
  })

  function handleCloseTag(tag: CascadeNode) {
    checkedSet.value.delete(tag)
    updateMultipleValue()
  }

  function checkItem(item: CascadeNode, checked: boolean) {
    const childrenKey = props.childrenKey ?? 'children'
    if (checked) {
      dfs(
        item as unknown as Record<string, unknown>,
        (node) => {
          checkedSet.value.add(node as unknown as CascadeNode)
        },
        childrenKey
      )
    } else {
      dfs(
        item as unknown as Record<string, unknown>,
        (node) => {
          checkedSet.value.delete(node as unknown as CascadeNode)
        },
        childrenKey
      )
    }

    triggerRef(checkedSet)

    updateMultipleValue()
  }

  function initMultipleCheck() {
    const { modelValue } = props
    getPanelItemList()
    if (Array.isArray(modelValue)) {
      checkedSet.value = new Set(modelValue.map((v) => dataMap.value.get(v)!))
    }
  }

  watch(
    [() => props.multiple, () => props.modelValue, forest],
    ([multiple]) => {
      if (!multiple || isUserActive()) return
      initMultipleCheck()
    },
    { immediate: false }
  )

  return { hovered, tags, checkedSet, restTag, handleCloseTag, updateMultipleValue, checkItem }
}
