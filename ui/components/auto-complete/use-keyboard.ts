import { type ComputedRef, type Ref, ref, watch } from 'vue'

interface Options {
  options: ComputedRef<string[]>
  dropdownVisible: Ref<boolean>
  onSelect: (option: string, index: number) => void
  getDefaultIndex?: (options: string[]) => number
}

interface UseKeyboardReturned {
  point: Ref<number>
  handleKeydown: (event: KeyboardEvent) => void
}

export function useKeyboard(options: Options): UseKeyboardReturned {
  const {
    options: selectableOptions,
    dropdownVisible,
    onSelect,
    getDefaultIndex
  } = options
  const keys = new Set(['ArrowUp', 'ArrowDown', 'Enter', 'Escape'])

  const point = ref(-1)

  const resolveDefaultPoint = () => {
    if (!selectableOptions.value.length) return -1
    if (getDefaultIndex) {
      const index = getDefaultIndex(selectableOptions.value)
      if (index >= 0 && index < selectableOptions.value.length) {
        return index
      }
    }
    return 0
  }

  watch(
    [selectableOptions, dropdownVisible],
    ([value, visible]) => {
      if (!value.length || !visible) {
        point.value = -1
        return
      }
      if (point.value === -1 || point.value >= value.length) {
        point.value = resolveDefaultPoint()
      }
    },
    { immediate: true }
  )

  function moveToNext() {
    if (!selectableOptions.value.length) return
    if (!dropdownVisible.value) {
      dropdownVisible.value = true
      point.value = resolveDefaultPoint()
      return
    }
    const nextPoint = point.value + 1
    point.value =
      nextPoint < selectableOptions.value.length ? nextPoint : 0
  }

  function moveToPrev() {
    if (!selectableOptions.value.length) return
    if (!dropdownVisible.value) {
      dropdownVisible.value = true
      point.value = selectableOptions.value.length - 1
      return
    }
    const prevPoint = point.value - 1
    point.value =
      prevPoint > -1
        ? prevPoint
        : selectableOptions.value.length - 1
  }

  function selectOption() {
    if (!dropdownVisible.value) {
      if (selectableOptions.value.length) {
        dropdownVisible.value = true
        if (point.value === -1) {
          point.value = resolveDefaultPoint()
        }
      }
      return
    }
    const suggestion = selectableOptions.value[point.value]
    if (suggestion && point.value > -1) {
      onSelect(suggestion, point.value)
    }
    dropdownVisible.value = false
  }

  function closeDropdown() {
    dropdownVisible.value = false
  }

  const keyHandlerMap = {
    ArrowUp: moveToPrev,
    ArrowDown: moveToNext,
    Enter: selectOption,
    Escape: closeDropdown
  }

  function handleKeydown(event: KeyboardEvent) {
    const { key } = event
    if (!keys.has(key)) return
    event.preventDefault()
    event.stopPropagation()
    keyHandlerMap[key]()
  }

  return {
    point,

    handleKeydown
  }
}
