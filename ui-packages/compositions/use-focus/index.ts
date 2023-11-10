import { ref } from "vue"

/**
 * 聚焦
 * @param cb 回调
 * @returns
 */
export function useFocus(cb?: (focused: boolean) => void) {
  const focus = ref(false)

  const handleFocus = () => {
    focus.value = true
    cb?.(focus.value)
  }

  const handleBlur = () => {
    focus.value = false
    cb?.(focus.value)
  }

  return {
    focus,
    handleBlur,
    handleFocus
  }
}