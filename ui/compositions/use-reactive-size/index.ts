import { computed, reactive } from 'vue'
import { useResizeObserver, type RefElement } from '../use-resize-observer'

interface ElementSize {
  width: number
  height: number
}

/**
 * 响应式尺寸
 * @param targets 目标元素
 * @returns 目标元素的宽高
 */
export function useReactiveSize(target: RefElement): ElementSize
export function useReactiveSize(targets: RefElement[]): ElementSize[]
export function useReactiveSize(
  targets: RefElement | RefElement[]
): ElementSize | ElementSize[] {
  const sizes = Array.isArray(targets)
    ? targets.map(() => {
        return reactive({
          width: 0,
          height: 0
        })
      })
    : reactive({
        width: 0,
        height: 0
      })

  const sizesMap = Array.isArray(targets)
    ? computed(() => {
        const entries = targets
          .map((target, index) => {
            return [target.value!, (sizes as ElementSize[])[index]!]
          })
          .filter(([target]) => target) as [HTMLElement, ElementSize][]

        return new WeakMap(entries)
      })
    : computed(() => {
        return new WeakMap(
          targets.value ? [[targets.value, sizes as ElementSize]] : []
        )
      })

  useResizeObserver({
    targets,
    onResize(entries) {
      entries.forEach(entry => {
        const borderBoxSize = entry.borderBoxSize[0]!
        const size = sizesMap.value.get(entry.target as HTMLElement)
        if (size && borderBoxSize) {
          size.width = borderBoxSize.inlineSize
          size.height = borderBoxSize.blockSize
        }
      })
    }
  })

  return sizes
}
