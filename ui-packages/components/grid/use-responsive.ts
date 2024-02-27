import {
  computed,
  shallowRef,
  watch,
  type ShallowRef,
  shallowReactive,
  onBeforeUnmount
} from 'vue'
import type {
  Breakpoint,
  GridEmits,
  GridItemProps,
  GridProps
} from '@ui/types/components/grid'
import { debounce, equal } from 'cat-kit'
import { getContainerBreakpoint } from './breakpoint'
import type { Undef } from '@ui/types/helper'

interface ResponsiveOptions {
  props: GridProps
  emit: GridEmits
  /** 栅格容器模板引用 */
  gridRef: ShallowRef<HTMLElement | undefined>
}

export function useResponsive(options: ResponsiveOptions) {
  const { props, gridRef, emit } = options

  const gridItemsProps = shallowReactive<Set<GridItemProps>>(new Set())

  const responsive = computed(() => {
    return (
      (props.cols && typeof props.cols !== 'number') || !!gridItemsProps.size
    )
  })

  const currentBreakpoint = shallowRef<Breakpoint>()

  let observer: Undef<ResizeObserver>
  watch(
    [responsive, gridRef],
    ([responsive, dom]) => {
      if (!dom) return
      if (responsive) {
        observer = new ResizeObserver(
          debounce(([entry]) => {
            const target = entry!.target as HTMLElement
            const rect = target.getBoundingClientRect()
            emit('resize', rect)
            const breakpoint = getContainerBreakpoint(rect.width)
            if (equal(currentBreakpoint.value, breakpoint)) return
            currentBreakpoint.value = breakpoint
            emit('breakpoint-change', breakpoint)
          }, 0)
        )
        observer.observe(dom)
      } else {
        observer?.unobserve(dom)
        observer?.disconnect()
        observer = undefined
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    gridRef.value && observer?.unobserve(gridRef.value)
    observer?.disconnect()
  })

  return {
    responsive,
    gridItemsProps,
    currentBreakpoint
  }
}
