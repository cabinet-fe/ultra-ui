import { ref, type Ref } from 'vue'

export function useFocus(cb?: (focused: boolean) => void): {
  focus: Ref<boolean>
  handleBlur: () => void
  handleFocus: () => void
} {
  const focus = ref(false)

  const handleFocus = () => {
    focus.value = true
    cb?.(focus.value)
  }

  const handleBlur = () => {
    focus.value = false
    cb?.(focus.value)
  }

  return { focus, handleBlur, handleFocus }
}
