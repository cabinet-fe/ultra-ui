import { type ComputedRef, type ModelRef, type Ref, ref } from 'vue'

interface Options {
  model: ModelRef<string | undefined>
  suggestions: ComputedRef<string[]>
  dropdownVisible: Ref<boolean>
}

interface UseKeyboardReturned {
  point: Ref<number>
  handleKeydown: (event: KeyboardEvent) => void
}

export function useKeyboard(options: Options): UseKeyboardReturned {
  const { suggestions, model, dropdownVisible } = options
  const keys = new Set(['ArrowUp', 'ArrowDown', 'Enter', 'Escape'])

  const point = ref(0)

  function moveToNext() {
    const nextPoint = point.value + 1
    if (nextPoint < suggestions.value.length) {
      point.value = nextPoint
    } else {
      point.value = 0
    }
  }

  function moveToPrev() {
    const prevPoint = point.value - 1
    if (prevPoint > -1) {
      point.value = prevPoint
    } else {
      point.value = suggestions.value.length - 1
    }
  }

  function selectOption() {
    if (!dropdownVisible.value) {
      dropdownVisible.value = true
      return
    }
    const suggestion = suggestions.value[point.value]
    if (suggestion) {
      model.value = suggestion
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
