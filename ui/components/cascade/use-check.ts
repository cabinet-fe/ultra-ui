import type { CascadeProps, CascadeEmits, CascadeNode } from '@ui/types'
import type { Forest } from 'cat-kit'
import {
  computed,
  shallowRef,
  triggerRef,
  watch,
  type ComputedRef,
  type Ref,
  type ShallowRef
} from 'vue'

interface CheckOptions {
  props: CascadeProps
  emit: CascadeEmits
  dataMap: ShallowRef<Map<string, CascadeNode>>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  forest: ComputedRef<Forest<CascadeNode>>
  update: (fn: Function) => any
  getPanelItemList: (data?: CascadeNode[]) => void
}

export function useCheck(options: CheckOptions) {
  const {
    props,
    emit,
    dataMap,
    disabled,
    readonly,
    forest,
    update,
    getPanelItemList
  } = options

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

    modelValue.slice(0, visibilityLimit).forEach(k => {
      const option = dataMap.value.get(k)
      option && tags.push(option)
    })

    return tags
  })

  function updateMultipleValue() {
    const checkedArr = Array.from(checkedSet.value)
    const targetValues = checkedArr.map(item => item.value)
    const targetLabels = checkedArr.map(item => item.label)
    emit('update:modelValue', targetValues)
    emit('change', targetValues, targetLabels, checkedArr)
  }

  const restTag = computed(() => {
    const { visibilityLimit, modelValue } = props
    return (modelValue?.length ?? 0) - visibilityLimit!
  })

  function handleCloseTag(tag: CascadeNode) {
    checkedSet.value.delete(tag)
    updateMultipleValue()
  }

  function checkItem(item: CascadeNode, checked: boolean) {
    if (checked) {
      item.dft(node => {
        checkedSet.value.add(node)
      })
    } else {
      item.dft(node => {
        checkedSet.value.delete(node)
      })
    }

    triggerRef(checkedSet)

    updateMultipleValue()
  }

  function initMultipleCheck() {
    const { modelValue } = props
    getPanelItemList()
    if (Array.isArray(modelValue)) {
      checkedSet.value = new Set(modelValue.map(v => dataMap.value.get(v)!))
    }
  }

  watch(
    [() => props.multiple, () => props.modelValue, forest],
    ([multiple]) => {
      multiple && update(() => initMultipleCheck())
    },
    { immediate: false }
  )

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
