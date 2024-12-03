import { provide, shallowRef } from 'vue'
import { TableResizeKey } from './di'

export function useColResize() {
  const showResizeLine = shallowRef(false)

  const resizeLineTransformX = shallowRef(0)

  function handleResizeMousedown() {
    showResizeLine.value = true
  }

  function handleResizeMouseup() {
    showResizeLine.value = false
  }

  provide(TableResizeKey, {
    handleResizeMousedown,
    handleResizeMouseup
  })

  return {
    showResizeLine,
    resizeLineTransformX,
    handleResizeMousedown,
    handleResizeMouseup
  }
}
