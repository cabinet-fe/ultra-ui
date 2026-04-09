import { debounce } from '@cat-kit/core'
import type { Undef } from '@ultra-ui/utils/types/helper'
import {
  computed,
  shallowRef,
  watch,
  type ShallowRef,
  shallowReactive,
  onBeforeUnmount,
  type ComputedRef
} from 'vue'

import type { Breakpoint, GridEmits, GridItemProps, GridProps } from '../../types'
import { getContainerBreakpoint } from './breakpoint'

interface ResponsiveOptions {
  props: GridProps
  emit: GridEmits
  /** 栅格容器模板引用 */
  gridRef: ShallowRef<HTMLElement | null>
}

interface UseResponsiveReturned {
  responsive: ComputedRef<boolean>
  gridItemsProps: Set<GridItemProps>
  currentBreakpoint: ShallowRef<Breakpoint | undefined>
}

export function useResponsive(options: ResponsiveOptions): UseResponsiveReturned {
  const { props, gridRef, emit } = options

  const gridItemsProps = shallowReactive<Set<GridItemProps>>(new Set())

  const responsive = computed(() => {
    return (props.cols && typeof props.cols !== 'number') || !!gridItemsProps.size
  })

  const currentBreakpoint = shallowRef<Breakpoint>()

  let observer: Undef<ResizeObserver>

  watch(
    [responsive, gridRef],
    ([responsive, dom]) => {
      if (!dom) return

      observer?.unobserve(dom)
      observer?.disconnect()
      observer = undefined

      if (!responsive) {
        currentBreakpoint.value = undefined
        return
      }

      observer = new ResizeObserver(
        debounce(([entry]) => {
          const target = entry!.target as HTMLElement
          const rect = target.getBoundingClientRect()
          emit('resize', rect)
          const breakpoint = getContainerBreakpoint(target.offsetWidth)
          const prev = currentBreakpoint.value
          if (
            prev !== undefined &&
            prev.name === breakpoint.name &&
            prev.level === breakpoint.level
          ) {
            return
          }
          currentBreakpoint.value = breakpoint
          emit('breakpoint-change', breakpoint)
        }, 0)
      )
      observer.observe(dom)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    gridRef.value && observer?.unobserve(gridRef.value)
    observer?.disconnect()
  })

  return { responsive, gridItemsProps, currentBreakpoint }
}
