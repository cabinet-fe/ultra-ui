import type { CascadeProps, CascadeEmits } from '@ui/types'
import { getChainValue, Tree } from 'cat-kit'
import {
  computed,
  shallowRef,
  triggerRef,
  type Ref,
  type ShallowRef
} from 'vue'

interface CheckOptions {
  props: CascadeProps
  emit: CascadeEmits
  dataMap: ShallowRef<Map<string, Record<string, any>>>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
}

export function useCheck(options: CheckOptions) {
  const { props, emit, dataMap, disabled, readonly } = options

  const hovered = shallowRef(false)

  const checkedSet = shallowRef(new Set<Record<string, any>>())

  const tags = computed(() => {
    const { modelValue, multiple } = props
    let tags: Record<string, any>[] = []

    if (!multiple || !Array.isArray(modelValue)) return tags

    let { visibilityLimit } = props
    if (visibilityLimit! < 0) {
      visibilityLimit = 0
    }

    // 禁用时，显示全部
    if (disabled.value || readonly.value) {
      visibilityLimit = props.modelValue?.length ?? 0
    }

    modelValue.slice(0, visibilityLimit).forEach(k => {
      const option = dataMap.value.get(k)
      option && tags.push(option)
    })

    return tags
  })

  function updateMultipleValue() {
    const checkedArr = Array.from(checkedSet.value)
    const targetValues = checkedArr.map(item =>
      getChainValue(item, props.valueKey!)
    )
    const targetLabels = checkedArr.map(item =>
      getChainValue(item, props.labelKey!)
    )
    emit('update:modelValue', targetValues)
    emit('change', targetValues, targetLabels, checkedArr)
  }

  const restTag = computed(() => {
    const { visibilityLimit, modelValue } = props
    return (modelValue?.length ?? 0) - visibilityLimit!
  })

  function handleCloseTag(tag: Record<string, any>) {
    checkedSet.value.delete(tag)
    updateMultipleValue()
  }

  function checkItem(item: Record<string, any>, checked: boolean) {
    const { childrenKey } = props

    if (checked) {
      Tree.dft(
        item,
        item => {
          checkedSet.value.add(item)
        },
        childrenKey
      )
    } else {
      Tree.dft(
        item,
        item => {
          checkedSet.value.delete(item)
        },
        childrenKey
      )
    }

    triggerRef(checkedSet)

    updateMultipleValue()
  }

  return {
    hovered,
    tags,
    checkedSet,
    restTag,
    handleCloseTag,
    updateMultipleValue,
    checkItem
  }
}
