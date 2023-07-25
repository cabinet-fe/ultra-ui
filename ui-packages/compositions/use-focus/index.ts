import { ref } from "vue"

export function useFocus() {
  const focus = ref(false)

  const handleFocus = () => {
    focus.value = true
  }

  const handleBlur = () => {
    focus.value = false
  }

  return {
    focus,
    handleBlur,
    handleFocus
  }
}