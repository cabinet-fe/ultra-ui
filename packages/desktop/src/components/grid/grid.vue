<template>
  <component :is="tag" :class="cls.b" ref="grid">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { bem, removeStyles, setStyles, withUnit } from '@ultra-ui/utils'
import type { GridProps, GridEmits, _GridExposed } from '../../types'
import { GridDIKey } from './di'
import {
  type CSSProperties,
  provide,
  watch,
  useTemplateRef,
  computed
} from 'vue'
import { useResponsive } from './use-responsive'
import { getBreakpointCols } from './breakpoint'

defineOptions({
  name: 'Grid'
})

const props = withDefaults(defineProps<GridProps>(), {
  tag: 'div'
})

const emit = defineEmits<GridEmits>()

const cls = bem('grid')

const gridRef = useTemplateRef<HTMLElement>('grid')

const { currentBreakpoint, gridItemsProps } = useResponsive({
  props,
  emit,
  gridRef
})

const styles = computed(() => {
  const { gap, cols } = props
  const result: CSSProperties = {}

  // 间距
  if (typeof gap === 'number') {
    if (gap > 0) {
      result.rowGap = result.columnGap = gap + 'px'
    }
  } else if (typeof gap === 'string') {
    const [rowGap, columnGap] = gap.split(' ')
    result.columnGap = withUnit(columnGap || rowGap, 'px')
    result.rowGap = withUnit(rowGap, 'px')
  }

  const breakpoint = currentBreakpoint.value

  switch (typeof cols) {
    case 'number':
      result.gridTemplateColumns = `repeat(${cols}, minmax(0px, 1fr))`
      break
    case 'function':
      if (breakpoint) {
        result.gridTemplateColumns = `repeat(${cols(breakpoint)}, minmax(0px, 1fr))`
      }
      break
    case 'object':
      if (breakpoint) {
        const amount = getBreakpointCols(cols, breakpoint)
        result.gridTemplateColumns = `repeat(${amount}, minmax(0px, 1fr))`
      }
  }

  return result
})

watch([styles, gridRef], ([styles, dom]) => {
  if (!dom) return

  // 重置并移除样式
  removeStyles(dom, ['gridTemplateColumns', 'columnGap', 'rowGap'])
  setStyles(dom, styles)
})

provide(GridDIKey, {
  currentBreakpoint,
  gridItemsProps
})

defineExpose<_GridExposed>({
  el: gridRef
})
</script>
