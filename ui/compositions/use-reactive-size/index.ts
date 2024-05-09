import { reactive, type Ref, type ShallowRef } from 'vue'
import { useResizeObserver } from '../use-resize-observer'

/**
 * 响应式尺寸
 * @param target 目标元素
 * @returns 目标元素的宽高
 */
export function useReactiveSize(
  target: ShallowRef<HTMLElement | undefined> | Ref<HTMLElement | undefined>
): {
  width: number
  height: number
} {
  const size = reactive({
    width: 0,
    height: 0
  })

  useResizeObserver({
    target,
    onResize([entry]) {
      const borderBoxSize = entry!.borderBoxSize[0]!
      if (borderBoxSize) {
        const { inlineSize, blockSize } = borderBoxSize
        size.width = inlineSize
        size.height = blockSize
      }
    }
  })

  return size
}
