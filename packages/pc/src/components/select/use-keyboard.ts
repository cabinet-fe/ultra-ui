import { nextTick, type ShallowRef } from 'vue'

interface UseKeyboardConfig {
  options: ShallowRef<Record<string, any>[]>
  currentIndex: ShallowRef<number>
  selectOption: (option: Record<string, any>, index: number) => void
  getCurrentEl: () => HTMLElement | undefined
}

interface UseKeyboardReturned {
  /** 键盘事件处理 */
  handleKeydown: (e: KeyboardEvent) => void
}

export function useKeyboard(config: UseKeyboardConfig): UseKeyboardReturned {
  const { currentIndex, options, selectOption, getCurrentEl } = config

  async function navToCurrent() {
    await nextTick()
    getCurrentEl()?.scrollIntoView({
      block: 'nearest'
    })
  }

  const keyHandler = {
    ArrowDown: (e: KeyboardEvent) => {
      if (!options.value) return
      e.preventDefault()
      currentIndex.value = Math.min(
        currentIndex.value + 1,
        options.value.length - 1
      )
      navToCurrent()
    },

    ArrowUp: (e: KeyboardEvent) => {
      if (!options.value) return
      e.preventDefault()
      currentIndex.value = Math.max(currentIndex.value - 1, 0)
      navToCurrent()
    },

    Enter: (e: KeyboardEvent) => {
      if (!options.value) return
      e.preventDefault()
      if (
        currentIndex.value >= 0 &&
        currentIndex.value < options.value.length
      ) {
        const selectedOption = options.value[currentIndex.value]!
        selectOption(selectedOption, currentIndex.value)
      }
    }
  }

  /** 键盘事件处理 */
  const handleKeydown = (e: KeyboardEvent) => {
    const key = e.key as keyof typeof keyHandler
    keyHandler[key]?.(e)
  }

  return {
    handleKeydown
  }
}
